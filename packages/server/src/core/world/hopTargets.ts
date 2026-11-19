import type { PlanetId } from "@node-stream/shared";
import { distanceBetween } from "./distance.js";
import type { WorldPlanet } from "./generateWorld.js";
import { findNeighbors } from "./reachability.js";
export interface HopTarget {
  readonly planetId: PlanetId;
  readonly length: number;
}
export function computeHopTargets(planets: readonly WorldPlanet[], maxHopDistance: number): HopTarget[][] {
  const neighbors = findNeighbors(
    planets.map((planet) => planet.position),
    maxHopDistance,
  );
  return planets.map((planet, index) =>
    (neighbors[index] ?? []).flatMap((neighborIndex) => {
      const neighbor = planets[neighborIndex];
      return neighbor === undefined
        ? []
        : [{ planetId: neighbor.id, length: distanceBetween(planet.position, neighbor.position) }];
    }),
  );
}
