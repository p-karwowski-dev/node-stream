import type { MatchConfig } from "@node-stream/shared";
import type { FleetRegistry } from "../fleets/index.js";
import type { PlanetRegistry } from "../planets/index.js";
import type { ShipRegistry } from "../ships/index.js";
export function runProduction(
  tick: number,
  config: MatchConfig,
  planets: PlanetRegistry,
  fleets: FleetRegistry,
  ships: ShipRegistry,
): void {
  if (tick % config.productionIntervalTicks !== 0) {
    return;
  }
  for (const planet of planets.all()) {
    if (planet.ownerId === null) {
      continue;
    }
    for (let produced = 0; produced < config.shipsPerProduction; produced += 1) {
      fleets.append(planet.id, ships.create(planet.ownerId, tick));
    }
  }
}
