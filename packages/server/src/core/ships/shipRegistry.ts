import type { PlayerId, ShipId } from "@node-stream/shared";
import type { Ship } from "./ship.js";
export interface ShipRegistry {
  create(ownerId: PlayerId, readyTick: number): Ship;
  retire(ownerId: PlayerId, count: number): void;
  aliveCount(playerId: PlayerId): number;
}
const firstShipId: ShipId = 1;
export function createShipRegistry(): ShipRegistry {
  let nextShipId = firstShipId;
  const aliveCounts = new Map<PlayerId, number>();
  function adjustAlive(ownerId: PlayerId, delta: number): void {
    aliveCounts.set(ownerId, (aliveCounts.get(ownerId) ?? 0) + delta);
  }
  function create(ownerId: PlayerId, readyTick: number): Ship {
    const ship: Ship = { id: nextShipId, ownerId, hopsDone: 0, readyTick };
    nextShipId += 1;
    adjustAlive(ownerId, 1);
    return ship;
  }
  function retire(ownerId: PlayerId, count: number): void {
    if (count > 0) {
      adjustAlive(ownerId, -count);
    }
  }
  return {
    create,
    retire,
    aliveCount: (playerId) => aliveCounts.get(playerId) ?? 0,
  };
}
