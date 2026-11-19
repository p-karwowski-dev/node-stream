import type { MatchConfig, PlayerId, ShipId } from "@node-stream/shared";
export interface Ship {
  readonly id: ShipId;
  readonly ownerId: PlayerId;
  readonly hopsDone: number;
  readonly readyTick: number;
}
const percentScale = 100;
export function shipSpeed(ship: Ship, config: MatchConfig): number {
  return (
    config.initialShipSpeed -
    (ship.hopsDone * config.initialShipSpeed * config.speedDecayPercent) / percentScale
  );
}
export function canStartHop(ship: Ship, config: MatchConfig): boolean {
  return shipSpeed(ship, config) > 0;
}
export function completeHop(ship: Ship, readyTick: number): Ship {
  return { id: ship.id, ownerId: ship.ownerId, hopsDone: ship.hopsDone + 1, readyTick };
}
