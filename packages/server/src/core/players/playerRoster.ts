import type { PlayerId, PlayerKind, PlayerSetup } from "@node-stream/shared";
interface PlayerState {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  claimed: boolean;
  eliminated: boolean;
}
export interface PlayerView {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly claimed: boolean;
  readonly eliminated: boolean;
}
export interface PlayerRoster {
  all(): readonly PlayerView[];
  get(id: PlayerId): PlayerView | undefined;
  markClaimed(id: PlayerId): void;
  markEliminated(id: PlayerId): void;
}
export function createPlayerRoster(players: readonly PlayerSetup[]): PlayerRoster {
  const roster: PlayerState[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    kind: player.kind,
    claimed: false,
    eliminated: false,
  }));
  const byId = new Map<PlayerId, PlayerState>(roster.map((player) => [player.id, player]));
  function markClaimed(id: PlayerId): void {
    const player = byId.get(id);
    if (player !== undefined) {
      player.claimed = true;
    }
  }
  function markEliminated(id: PlayerId): void {
    const player = byId.get(id);
    if (player !== undefined) {
      player.eliminated = true;
    }
  }
  return {
    all: () => roster,
    get: (id) => byId.get(id),
    markClaimed,
    markEliminated,
  };
}
