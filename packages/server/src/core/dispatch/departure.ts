import type { MatchConfig } from "@node-stream/shared";
import type { InFlightShip } from "../arrivals/index.js";
import type { Link } from "../links/index.js";
import { shipSpeed } from "../ships/index.js";
import type { Ship } from "../ships/index.js";
const millisecondsPerSecond = 1000;
export function createDeparture(ship: Ship, link: Link, tick: number, config: MatchConfig): InFlightShip {
  const departureTime = tick * config.tickLengthMs;
  const travelTime = (link.length / shipSpeed(ship, config)) * millisecondsPerSecond;
  return { ship, from: link.from, to: link.to, departureTime, arrivalTime: departureTime + travelTime };
}
