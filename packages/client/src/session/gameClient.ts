import type { ClientMessage, Command, ConfigChanges, PlanetId, PlayerId, ServerMessage } from "@node-stream/shared";
import { createCommandIdSource, createGameConnection } from "../protocol/index.js";
import type { GameConnection } from "../protocol/index.js";
import { applyServerMessage, choosePlanet, withNotice } from "../state/index.js";
import type { ClientState, ClientStore } from "../state/index.js";
import type { TokenStore } from "./tokenStore.js";
export interface GameClientOptions {
  readonly url: string;
  readonly tokens: TokenStore;
  readonly store: ClientStore;
  readonly now: () => number;
}
export interface GameClient {
  connect(): void;
  join(name: string): void;
  setConfig(changes: ConfigChanges): void;
  addAi(): void;
  removeAi(playerId: PlayerId): void;
  startMatch(): void;
  returnToLobby(): void;
  choosePlanet(planetId: PlanetId): void;
  createLink(from: PlanetId, to: PlanetId): void;
  removeLink(from: PlanetId, to: PlanetId): void;
  clearSource(): void;
  showNotice(text: string): void;
}
const defaultAiStrategy = "weakestInRange";
const disconnectedText = "Disconnected from the server";
type WithoutCommandId<Each> = Each extends Command ? Omit<Each, "commandId"> : never;
type CommandWithoutId = WithoutCommandId<Command>;
export function createGameClient(options: GameClientOptions): GameClient {
  const { url, tokens, store, now } = options;
  const commandIds = createCommandIdSource();
  let connection: GameConnection | undefined;
  const send = (message: ClientMessage) => connection?.send(message);
  const sendCommand = (command: CommandWithoutId) => {
    const commandId = commandIds.next();
    store.update((state) => ({ ...state, sentCommandIds: new Set([...state.sentCommandIds, commandId]) }));
    send({ ...command, commandId } as Command);
  };
  const setSource = (selectedSourceId: PlanetId | null) =>
    store.update((state) => (state.selectedSourceId === selectedSourceId ? state : { ...state, selectedSourceId }));
  const receive = (message: ServerMessage) => {
    store.update((state) => applyServerMessage(state, message, now()));
    if (message.type === "joined") {
      tokens.save(message.token);
    }
    if (message.type === "error" && message.code === "unknownToken") {
      tokens.clear();
      store.update((state) => ({ ...state, hasStoredToken: false, identity: null, lobby: null, match: null }));
    }
  };
  const open = () => {
    store.update((state) => ({ ...state, connection: "connecting" }));
    const isCurrent = () => connection === opened;
    const opened: GameConnection = createGameConnection(url, {
      onOpen: () => {
        if (!isCurrent()) {
          return;
        }
        store.update((state) => ({ ...state, connection: "open" }));
        const token = tokens.load();
        if (token !== null) {
          send({ type: "reconnect", token });
        }
      },
      onMessage: (message) => {
        if (isCurrent()) {
          receive(message);
        }
      },
      onClose: () => {
        if (isCurrent()) {
          store.update((state): ClientState => withNotice({ ...state, connection: "closed" }, disconnectedText));
        }
      },
    });
    connection = opened;
  };
  return {
    connect: () => {
      connection?.close();
      open();
    },
    join: (name) => send({ type: "join", name }),
    setConfig: (changes) => send({ type: "setConfig", changes }),
    addAi: () => send({ type: "addAi", strategy: defaultAiStrategy }),
    removeAi: (playerId) => send({ type: "removeAi", playerId }),
    startMatch: () => send({ type: "startMatch" }),
    returnToLobby: () => send({ type: "returnToLobby" }),
    choosePlanet: (planetId) => {
      const state = store.getState();
      if (state.match === null || state.identity === null) {
        return;
      }
      const choice = choosePlanet(state.match, state.identity.playerId, state.selectedSourceId, planetId);
      switch (choice?.kind) {
        case "claim":
          sendCommand({ type: "claimPlanet", planetId: choice.planetId });
          return;
        case "createLink":
          sendCommand({ type: "createLink", from: choice.from, to: choice.to });
          return;
        case "selectSource":
          setSource(choice.planetId);
          return;
        case "clearSource":
          setSource(null);
          return;
        case "notice":
          store.update((current) => withNotice(current, choice.text));
          return;
      }
    },
    createLink: (from, to) => sendCommand({ type: "createLink", from, to }),
    removeLink: (from, to) => sendCommand({ type: "removeLink", from, to }),
    clearSource: () => setSource(null),
    showNotice: (text) => store.update((state) => withNotice(state, text)),
  };
}
