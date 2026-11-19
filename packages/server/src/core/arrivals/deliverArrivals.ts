import type { MatchConfig } from "@node-stream/shared";
import type { FleetRegistry } from "../fleets/index.js";
import { completeHop } from "../ships/index.js";
import type { ArrivalQueue } from "./arrivalQueue.js";
export function deliverArrivals(
  tick: number,
  config: MatchConfig,
  queue: ArrivalQueue,
  fleets: FleetRegistry,
): void {
  const tickEndTime = tick * config.tickLengthMs;
  for (const entry of queue.popDueBy(tickEndTime)) {
    fleets.append(entry.to, completeHop(entry.ship, tick + config.hopDelayTicks));
  }
}
