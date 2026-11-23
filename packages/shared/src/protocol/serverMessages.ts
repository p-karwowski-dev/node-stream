import type { ConfigError, MatchConfig } from "../types/config.js";
import type { GameEvent, MatchEndedEvent } from "../types/events.js";
import type { PlayerId } from "../types/ids.js";
import type { PlayerKind } from "../types/players.js";
import type {
  LinkSnapshot,
  MatchStatus,
  PlanetSnapshot,
  PlayerSnapshot,
  ShipInFlightSnapshot,
} from "../types/snapshot.js";

export type ErrorCode =
  | "invalidMessage"
  | "messageTooLarge"
  | "notJoined"
  | "alreadyJoined"
  | "unknownToken"
  | "wrongPhase"
  | "notHost"
  | "lobbyFull"
  | "unknownStrategy"
  | "notAiPlayer"
  | "invalidConfig"
  | "emptyWorld";

export interface LobbyPlayer {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly strategy: string | null;
  readonly connected: boolean;
}

export interface JoinedMessage {
  readonly type: "joined";
  readonly playerId: PlayerId;
  readonly token: string;
  readonly isHost: boolean;
}

export interface LobbyStateMessage {
  readonly type: "lobbyState";
  readonly players: readonly LobbyPlayer[];
  readonly config: MatchConfig;
  readonly hostId: PlayerId | null;
}

export interface MatchStartedMessage {
  readonly type: "matchStarted";
  readonly countdownSeconds: number;
  readonly config: MatchConfig;
  readonly players: readonly PlayerSnapshot[];
  readonly planets: readonly PlanetSnapshot[];
  readonly links: readonly LinkSnapshot[];
}

export interface TickMessage {
  readonly type: "tick";
  readonly tick: number;
  readonly events: readonly GameEvent[];
}

export interface SnapshotMessage {
  readonly type: "snapshot";
  readonly config: MatchConfig;
  readonly tick: number;
  readonly status: MatchStatus;
  readonly planets: readonly PlanetSnapshot[];
  readonly links: readonly LinkSnapshot[];
  readonly ships: readonly ShipInFlightSnapshot[];
  readonly players: readonly PlayerSnapshot[];
  readonly result: MatchEndedEvent | null;
}

export interface ErrorMessage {
  readonly type: "error";
  readonly code: ErrorCode;
  readonly message: string;
  readonly configErrors: readonly ConfigError[];
}

export type ServerMessage =
  | JoinedMessage
  | LobbyStateMessage
  | MatchStartedMessage
  | TickMessage
  | SnapshotMessage
  | ErrorMessage;
