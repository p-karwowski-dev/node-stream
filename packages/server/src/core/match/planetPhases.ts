import type { GameEvent, PlanetId } from "@node-stream/shared";
import { resolvePlanetBattle, resolveShipBattle } from "../combat/index.js";
import { dispatchOwnerFleet } from "../dispatch/index.js";
import type { MatchState } from "./matchState.js";
function releaseEmptyFleets(state: MatchState, occupied: readonly PlanetId[]): void {
  for (const planetId of occupied) {
    state.fleets.releaseEmpty(planetId);
  }
}
function runShipBattles(state: MatchState, occupied: readonly PlanetId[]): void {
  for (const planetId of occupied) {
    const fleets = state.fleets.fleetsAt(planetId);
    if (fleets.size >= 2) {
      resolveShipBattle(fleets, state.ships);
    }
  }
}
function runPlanetBattles(state: MatchState, occupied: readonly PlanetId[], events: GameEvent[]): void {
  for (const planetId of occupied) {
    const fleets = state.fleets.fleetsAt(planetId);
    const ownerId = state.planets.get(planetId)?.ownerId ?? null;
    for (const [attackerId, fleet] of fleets) {
      if (attackerId !== ownerId) {
        events.push(...resolvePlanetBattle(planetId, fleet, attackerId, state));
      }
    }
  }
}
function runDispatch(state: MatchState, occupied: readonly PlanetId[], tick: number, events: GameEvent[]): void {
  for (const planetId of occupied) {
    const ownerId = state.planets.get(planetId)?.ownerId ?? null;
    const fleet = ownerId === null ? undefined : state.fleets.fleetOf(planetId, ownerId);
    if (fleet === undefined || fleet.length === 0) {
      continue;
    }
    for (const event of dispatchOwnerFleet(planetId, fleet, tick, state)) {
      events.push(event);
    }
  }
}
export function runPlanetPhases(state: MatchState, tick: number): GameEvent[] {
  const occupied = state.fleets.occupiedPlanets();
  const events: GameEvent[] = [];
  runShipBattles(state, occupied);
  releaseEmptyFleets(state, occupied);
  runPlanetBattles(state, occupied, events);
  releaseEmptyFleets(state, occupied);
  runDispatch(state, occupied, tick, events);
  releaseEmptyFleets(state, occupied);
  return events;
}
