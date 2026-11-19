import type { GameEvent, MatchConfig, PlanetId } from "@node-stream/shared";
import type { ArrivalQueue } from "../arrivals/index.js";
import type { ShipDeque } from "../fleets/index.js";
import type { LinkRegistry } from "../links/index.js";
import type { PlanetRegistry } from "../planets/index.js";
import { canStartHop } from "../ships/index.js";
import type { ShipRegistry } from "../ships/index.js";
import { createDeparture } from "./departure.js";
export interface DispatchContext {
  readonly config: MatchConfig;
  readonly planets: PlanetRegistry;
  readonly links: LinkRegistry;
  readonly ships: ShipRegistry;
  readonly arrivals: ArrivalQueue;
}
export function dispatchOwnerFleet(
  planetId: PlanetId,
  fleet: ShipDeque,
  tick: number,
  context: DispatchContext,
): GameEvent[] {
  const { config, planets, links, ships, arrivals } = context;
  const ownerId = planets.get(planetId)?.ownerId ?? null;
  if (ownerId === null) {
    return [];
  }
  const hasLinks = links.outgoing(planetId).length > 0;
  const events: GameEvent[] = [];
  let reinforcing = 0;
  let exhausted = 0;
  const handled = fleet.length;
  for (let index = 0; index < handled; index += 1) {
    const ship = fleet.popFront();
    if (ship === undefined) {
      break;
    }
    if (ship.readyTick > tick) {
      fleet.pushBack(ship);
      continue;
    }
    if (!hasLinks) {
      reinforcing += 1;
      continue;
    }
    if (!canStartHop(ship, config)) {
      exhausted += 1;
      continue;
    }
    const link = links.nextDeparture(planetId);
    if (link === undefined) {
      fleet.pushBack(ship);
      continue;
    }
    const departure = createDeparture(ship, link, tick, config);
    arrivals.push(departure);
    events.push({
      type: "shipDeparted",
      shipId: ship.id,
      ownerId: ship.ownerId,
      from: departure.from,
      to: departure.to,
      departureTime: departure.departureTime,
      arrivalTime: departure.arrivalTime,
    });
  }
  planets.addPoints(planetId, reinforcing * config.reinforcementPerShip);
  ships.retire(ownerId, reinforcing + exhausted);
  return events;
}
