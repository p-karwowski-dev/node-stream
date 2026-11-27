import type {
  CommandId,
  ConfigError,
  LinkSnapshot,
  LobbyPlayer,
  MatchConfig,
  MatchEndedEvent,
  PlanetId,
  PlanetSnapshot,
  PlayerId,
  PlayerSnapshot,
  ShipInFlightSnapshot,
} from "@node-stream/shared";
export type ConnectionStatus = "connecting" | "open" | "closed";
export interface Identity {
  readonly playerId: PlayerId;
  readonly isHost: boolean;
}
export interface LobbyView {
  readonly players: readonly LobbyPlayer[];
  readonly config: MatchConfig;
  readonly hostId: PlayerId | null;
}
export interface Notice {
  readonly id: number;
  readonly text: string;
}
export interface MatchView {
  readonly config: MatchConfig;
  readonly players: readonly PlayerSnapshot[];
  readonly planets: readonly PlanetSnapshot[];
  readonly planetIndex: ReadonlyMap<PlanetId, number>;
  readonly links: readonly LinkSnapshot[];
  readonly ships: readonly ShipInFlightSnapshot[];
  readonly tick: number;
  readonly tickReceivedAt: number;
  readonly countdownEndsAt: number | null;
  readonly hasClaimed: boolean;
  readonly result: MatchEndedEvent | null;
  readonly worldKey: number;
}
export interface ClientState {
  readonly connection: ConnectionStatus;
  readonly hasStoredToken: boolean;
  readonly identity: Identity | null;
  readonly lobby: LobbyView | null;
  readonly configErrors: readonly ConfigError[];
  readonly match: MatchView | null;
  readonly selectedSourceId: PlanetId | null;
  readonly sentCommandIds: ReadonlySet<CommandId>;
  readonly notice: Notice | null;
  readonly nextNoticeId: number;
  readonly nextWorldKey: number;
}
export type Screen = "connecting" | "join" | "lobby" | "match" | "ended";
export function initialClientState(hasStoredToken: boolean): ClientState {
  return {
    connection: "connecting",
    hasStoredToken,
    identity: null,
    lobby: null,
    configErrors: [],
    match: null,
    selectedSourceId: null,
    sentCommandIds: new Set(),
    notice: null,
    nextNoticeId: 1,
    nextWorldKey: 1,
  };
}
export function currentScreen(state: ClientState): Screen {
  if (state.identity === null) {
    return state.connection === "connecting" && state.hasStoredToken ? "connecting" : "join";
  }
  if (state.match !== null) {
    return state.match.result === null ? "match" : "ended";
  }
  return state.lobby === null ? "connecting" : "lobby";
}
export function withNotice(state: ClientState, text: string): ClientState {
  return { ...state, notice: { id: state.nextNoticeId, text }, nextNoticeId: state.nextNoticeId + 1 };
}
