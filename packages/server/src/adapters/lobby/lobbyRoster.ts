import type { LobbyPlayer, PlayerId, PlayerKind, PlayerSetup } from "@node-stream/shared";
import type { AiPlayer, Strategy } from "../ai/index.js";

interface RosterMember {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly strategy: Strategy | null;
  connected: boolean;
}

export interface LobbyRoster {
  addHuman(name: string): PlayerId;
  addAi(strategy: Strategy): PlayerId;
  removeAi(playerId: PlayerId): boolean;
  has(playerId: PlayerId): boolean;
  hostId(): PlayerId | null;
  count(): number;
  setConnected(playerId: PlayerId, connected: boolean): void;
  lobbyPlayers(): LobbyPlayer[];
  playerSetups(): PlayerSetup[];
  aiPlayers(): AiPlayer[];
}

const firstPlayerId = 1;

function aiName(playerId: PlayerId): string {
  return `AI ${playerId}`;
}

export function createLobbyRoster(): LobbyRoster {
  const members: RosterMember[] = [];
  let nextPlayerId = firstPlayerId;
  let host: PlayerId | null = null;
  const takePlayerId = (): PlayerId => {
    const playerId = nextPlayerId;
    nextPlayerId += 1;
    return playerId;
  };
  const find = (playerId: PlayerId) => members.find((member) => member.id === playerId);
  return {
    addHuman: (name) => {
      const id = takePlayerId();
      members.push({ id, name, kind: "human", strategy: null, connected: false });
      host ??= id;
      return id;
    },
    addAi: (strategy) => {
      const id = takePlayerId();
      members.push({ id, name: aiName(id), kind: "ai", strategy, connected: true });
      return id;
    },
    removeAi: (playerId) => {
      const index = members.findIndex((member) => member.id === playerId && member.kind === "ai");
      if (index < 0) {
        return false;
      }
      members.splice(index, 1);
      return true;
    },
    has: (playerId) => find(playerId) !== undefined,
    hostId: () => host,
    count: () => members.length,
    setConnected: (playerId, connected) => {
      const member = find(playerId);
      if (member !== undefined && member.kind === "human") {
        member.connected = connected;
      }
    },
    lobbyPlayers: () =>
      members.map(({ id, name, kind, strategy, connected }) => ({
        id,
        name,
        kind,
        strategy: strategy?.name ?? null,
        connected,
      })),
    playerSetups: () => members.map(({ id, name, kind }) => ({ id, name, kind })),
    aiPlayers: () =>
      members.flatMap(({ id, strategy }) => (strategy === null ? [] : [{ playerId: id, strategy }])),
  };
}
