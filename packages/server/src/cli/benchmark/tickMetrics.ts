import { performance } from "node:perf_hooks";
import type { MatchConfig, TickResult } from "@node-stream/shared";
import type { MatchView } from "../../core/match/index.js";
import type { TickObserver } from "../headlessMatch.js";
import { millisecondsPerSecond } from "../timeUnits.js";
export interface TickMetricsSummary {
  readonly stepMilliseconds: number;
  readonly maxStepMilliseconds: number;
  readonly peakShipsInFlight: number;
  readonly peakArrivalsPerTick: number;
  readonly peakDeparturesPerTick: number;
  readonly peakOwnedPlanets: number;
  readonly peakShipsProducedPerSecond: number;
}
export interface TickMetrics extends TickObserver {
  summary(): TickMetricsSummary;
}
function countOwnedPlanets(view: MatchView): number {
  return view.planets().filter((planet) => planet.ownerId !== null).length;
}
export function createTickMetrics(config: MatchConfig): TickMetrics {
  const arrivalsByTick = new Map<number, number>();
  let stepStart = 0;
  let stepMilliseconds = 0;
  let maxStepMilliseconds = 0;
  let shipsInFlight = 0;
  let peakShipsInFlight = 0;
  let peakArrivalsPerTick = 0;
  let peakDeparturesPerTick = 0;
  let peakOwnedPlanets = 0;
  const recordDepartures = (result: TickResult): number => {
    let departures = 0;
    for (const event of result.events) {
      if (event.type === "shipDeparted") {
        const arrivalTick = Math.ceil(event.arrivalTime / config.tickLengthMs);
        arrivalsByTick.set(arrivalTick, (arrivalsByTick.get(arrivalTick) ?? 0) + 1);
        departures += 1;
      }
    }
    return departures;
  };
  const takeArrivals = (tick: number): number => {
    const arrivals = arrivalsByTick.get(tick) ?? 0;
    arrivalsByTick.delete(tick);
    return arrivals;
  };
  return {
    beforeStep: () => {
      stepStart = performance.now();
    },
    afterTick: (result, view) => {
      const elapsed = performance.now() - stepStart;
      stepMilliseconds += elapsed;
      maxStepMilliseconds = Math.max(maxStepMilliseconds, elapsed);
      const arrivals = takeArrivals(result.tick);
      const departures = recordDepartures(result);
      shipsInFlight += departures - arrivals;
      peakShipsInFlight = Math.max(peakShipsInFlight, shipsInFlight);
      peakArrivalsPerTick = Math.max(peakArrivalsPerTick, arrivals);
      peakDeparturesPerTick = Math.max(peakDeparturesPerTick, departures);
      if (result.tick % config.productionIntervalTicks === 0) {
        peakOwnedPlanets = Math.max(peakOwnedPlanets, countOwnedPlanets(view));
      }
    },
    summary: () => ({
      stepMilliseconds,
      maxStepMilliseconds,
      peakShipsInFlight,
      peakArrivalsPerTick,
      peakDeparturesPerTick,
      peakOwnedPlanets,
      peakShipsProducedPerSecond:
        (peakOwnedPlanets * config.shipsPerProduction * millisecondsPerSecond) /
        (config.productionIntervalTicks * config.tickLengthMs),
    }),
  };
}
