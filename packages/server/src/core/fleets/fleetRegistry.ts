import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { Ship } from "../ships/index.js";
import { createShipDeque } from "./shipDeque.js";
import type { ShipDeque } from "./shipDeque.js";
export interface FleetRegistry {
  append(planetId: PlanetId, ship: Ship): void;
  fleetsAt(planetId: PlanetId): ReadonlyMap<PlayerId, ShipDeque>;
  fleetOf(planetId: PlanetId, playerId: PlayerId): ShipDeque | undefined;
  shipsAt(planetId: PlanetId): number;
  occupiedPlanets(): PlanetId[];
  releaseEmpty(planetId: PlanetId): void;
}
const noFleets: ReadonlyMap<PlayerId, ShipDeque> = new Map();
export function createFleetRegistry(): FleetRegistry {
  const planets = new Map<PlanetId, Map<PlayerId, ShipDeque>>();
  function append(planetId: PlanetId, ship: Ship): void {
    let fleets = planets.get(planetId);
    if (fleets === undefined) {
      fleets = new Map();
      planets.set(planetId, fleets);
    }
    let fleet = fleets.get(ship.ownerId);
    if (fleet === undefined) {
      fleet = createShipDeque();
      fleets.set(ship.ownerId, fleet);
    }
    fleet.pushBack(ship);
  }
  function shipsAt(planetId: PlanetId): number {
    let total = 0;
    for (const fleet of planets.get(planetId)?.values() ?? []) {
      total += fleet.length;
    }
    return total;
  }
  function releaseEmpty(planetId: PlanetId): void {
    const fleets = planets.get(planetId);
    if (fleets === undefined) {
      return;
    }
    for (const [playerId, fleet] of [...fleets]) {
      if (fleet.length === 0) {
        fleets.delete(playerId);
      }
    }
    if (fleets.size === 0) {
      planets.delete(planetId);
    }
  }
  return {
    append,
    fleetsAt: (planetId) => planets.get(planetId) ?? noFleets,
    fleetOf: (planetId, playerId) => planets.get(planetId)?.get(playerId),
    shipsAt,
    occupiedPlanets: () => [...planets.keys()].sort((first, second) => first - second),
    releaseEmpty,
  };
}
