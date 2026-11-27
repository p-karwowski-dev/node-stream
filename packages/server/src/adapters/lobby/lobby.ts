import type {
  Command,
  ErrorMessage,
  LobbyActionMessage,
  MatchConfig,
  MatchEndedEvent,
  PlayerId,
  ReturnToLobbyMessage,
} from "@node-stream/shared";
import { MatchSetupError } from "../../core/match/index.js";
import { findStrategy } from "../ai/index.js";
import { errorMessage } from "./errorMessage.js";
import { applyConfigChanges, validateLobbyConfig } from "./lobbyConfig.js";
import type { LobbyOutbox } from "./lobbyOutbox.js";
import { createLobbyRoster } from "./lobbyRoster.js";
import { createMatchSession } from "./matchSession.js";
import type { MatchSession } from "./matchSession.js";

export type LobbyPhase = "lobby" | "running" | "ended";

export interface MatchStartSummary {
  readonly players: number;
  readonly planets: number;
  readonly seed: number;
}

export interface LobbyHooks {
  readonly onMatchStarted?: (summary: MatchStartSummary) => void;
  readonly onMatchEnded?: (lastTick: number, ending: MatchEndedEvent, commandLogEntries: number) => void;
  readonly onLobbyReopened?: () => void;
}

export interface LobbyOptions {
  readonly config: MatchConfig;
  readonly outbox: LobbyOutbox;
  readonly hooks?: LobbyHooks;
}

export type JoinResult =
  | { readonly ok: true; readonly playerId: PlayerId; readonly isHost: boolean }
  | { readonly ok: false; readonly error: ErrorMessage };

export interface Lobby {
  join(name: string): JoinResult;
  isHost(playerId: PlayerId): boolean;
  playerConnected(playerId: PlayerId): void;
  playerDisconnected(playerId: PlayerId): void;
  handle(playerId: PlayerId, message: LobbyActionMessage | ReturnToLobbyMessage | Command): void;
  stop(): void;
}

const wrongPhaseForLobbyAction = "This action is only allowed in the lobby before the match starts";
const wrongPhaseForCommand = "Commands are only accepted while the match is running";
const wrongPhaseForJoin = "The match has started; only existing players can reconnect";
const wrongPhaseForReturn = "The match has not ended yet";
const notHostText = "Only the host can do this";

export function createLobby(options: LobbyOptions): Lobby {
  const { outbox, hooks = {} } = options;
  const roster = createLobbyRoster();
  let config = options.config;
  let phase: LobbyPhase = "lobby";
  let session: MatchSession | undefined;
  const reply = (playerId: PlayerId, error: ErrorMessage) => outbox.sendTo(playerId, error);
  const broadcastLobbyState = () =>
    outbox.broadcast({ type: "lobbyState", players: roster.lobbyPlayers(), config, hostId: roster.hostId() });
  const startMatch = (hostId: PlayerId) => {
    const configErrors = validateLobbyConfig(config, roster.count());
    if (configErrors.length > 0) {
      reply(hostId, errorMessage("invalidConfig", "The match config is invalid", configErrors));
      return;
    }
    phase = "running";
    try {
      session = createMatchSession({
        config,
        players: roster.playerSetups(),
        aiPlayers: roster.aiPlayers(),
        outbox,
        onEnded: (lastTick, ending, commandLogEntries) => {
          phase = "ended";
          hooks.onMatchEnded?.(lastTick, ending, commandLogEntries);
        },
      });
    } catch (error) {
      if (!(error instanceof MatchSetupError)) {
        throw error;
      }
      phase = "lobby";
      reply(
        hostId,
        error.reason === "emptyWorld"
          ? errorMessage("emptyWorld", "The generated world has no planets")
          : errorMessage("invalidConfig", "The match config is invalid", error.configErrors),
      );
      return;
    }
    hooks.onMatchStarted?.({ players: roster.count(), planets: session.planetCount, seed: config.seed });
  };
  const handleLobbyAction = (playerId: PlayerId, message: LobbyActionMessage) => {
    if (phase !== "lobby") {
      reply(playerId, errorMessage("wrongPhase", wrongPhaseForLobbyAction));
      return;
    }
    if (roster.hostId() !== playerId) {
      reply(playerId, errorMessage("notHost", notHostText));
      return;
    }
    switch (message.type) {
      case "setConfig": {
        const outcome = applyConfigChanges(config, message.changes, roster.count());
        if (!outcome.ok) {
          reply(playerId, errorMessage("invalidConfig", "The config changes are invalid", outcome.errors));
          return;
        }
        config = outcome.config;
        broadcastLobbyState();
        return;
      }
      case "addAi": {
        const strategy = findStrategy(message.strategy);
        if (strategy === undefined) {
          reply(playerId, errorMessage("unknownStrategy", "No AI strategy has this name"));
          return;
        }
        if (roster.count() >= config.maxPlayers) {
          reply(playerId, errorMessage("lobbyFull", "The lobby has reached maxPlayers"));
          return;
        }
        roster.addAi(strategy);
        broadcastLobbyState();
        return;
      }
      case "removeAi": {
        if (!roster.removeAi(message.playerId)) {
          reply(playerId, errorMessage("notAiPlayer", "No AI player has this ID"));
          return;
        }
        broadcastLobbyState();
        return;
      }
      case "startMatch":
        startMatch(playerId);
        return;
    }
  };
  const returnToLobby = (playerId: PlayerId) => {
    if (phase !== "ended") {
      reply(playerId, errorMessage("wrongPhase", wrongPhaseForReturn));
      return;
    }
    if (roster.hostId() !== playerId) {
      reply(playerId, errorMessage("notHost", notHostText));
      return;
    }
    session?.stop();
    session = undefined;
    phase = "lobby";
    broadcastLobbyState();
    hooks.onLobbyReopened?.();
  };
  return {
    join: (name) => {
      if (phase !== "lobby") {
        return { ok: false, error: errorMessage("wrongPhase", wrongPhaseForJoin) };
      }
      if (roster.count() >= config.maxPlayers) {
        return { ok: false, error: errorMessage("lobbyFull", "The lobby has reached maxPlayers") };
      }
      const playerId = roster.addHuman(name);
      return { ok: true, playerId, isHost: roster.hostId() === playerId };
    },
    isHost: (playerId) => roster.hostId() === playerId,
    playerConnected: (playerId) => {
      roster.setConnected(playerId, true);
      if (session === undefined) {
        broadcastLobbyState();
        return;
      }
      session.sendState(playerId);
    },
    playerDisconnected: (playerId) => {
      roster.setConnected(playerId, false);
      if (phase === "lobby") {
        broadcastLobbyState();
      }
    },
    handle: (playerId, message) => {
      switch (message.type) {
        case "claimPlanet":
        case "createLink":
        case "removeLink":
          if (phase !== "running" || session === undefined) {
            reply(playerId, errorMessage("wrongPhase", wrongPhaseForCommand));
            return;
          }
          session.submit(playerId, message);
          return;
        case "returnToLobby":
          returnToLobby(playerId);
          return;
        default:
          handleLobbyAction(playerId, message);
      }
    },
    stop: () => {
      session?.stop();
    },
  };
}
