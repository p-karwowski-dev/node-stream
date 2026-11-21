import { parseArgs } from "node:util";
import { weakestInRange } from "../../adapters/ai/index.js";
import { buildMatchConfig } from "../configFile.js";
import { runHeadlessMatch } from "../headlessMatch.js";
import { parseIntegerOption, parseOptions } from "../options.js";
import { millisecondsPerSecond } from "../timeUnits.js";
import { benchmarkDefaultSeed, benchmarkScenarios } from "./benchmarkScenarios.js";
import type { BenchmarkScenario } from "./benchmarkScenarios.js";
import { createTickMetrics } from "./tickMetrics.js";
const maxStepDecimals = 2;
function runScenario(scenario: BenchmarkScenario, seed: number) {
  const config = buildMatchConfig(scenario.overrides, seed);
  const metrics = createTickMetrics(config);
  const report = runHeadlessMatch({ config, aiPlayerCount: config.maxPlayers, observer: metrics });
  const summary = metrics.summary();
  return {
    scenario: scenario.name,
    planets: report.planetCount,
    aiPlayers: report.players.length,
    ticks: report.lastTick,
    end: report.ending.reason,
    setupMs: Math.round(report.setupMilliseconds),
    runMs: Math.round(report.runMilliseconds),
    ticksPerSecond: Math.round((report.lastTick / report.runMilliseconds) * millisecondsPerSecond),
    coreTicksPerSecond: Math.round((report.lastTick / summary.stepMilliseconds) * millisecondsPerSecond),
    maxStepMs: Number(summary.maxStepMilliseconds.toFixed(maxStepDecimals)),
    peakShipsProducedPerSecond: Math.round(summary.peakShipsProducedPerSecond),
    peakShipsInFlight: summary.peakShipsInFlight,
    peakArrivalsPerTick: summary.peakArrivalsPerTick,
    peakDeparturesPerTick: summary.peakDeparturesPerTick,
  };
}
export function benchmarkCommand(args: string[]): void {
  const values = parseOptions(
    () =>
      parseArgs({
        args,
        options: { seed: { type: "string" } },
        strict: true,
        allowPositionals: false,
      }).values,
  );
  const seed = parseIntegerOption("seed", values.seed) ?? benchmarkDefaultSeed;
  console.log(`benchmark seed ${seed}, ${weakestInRange.name} AI players = maxPlayers`);
  console.table(benchmarkScenarios.map((scenario) => runScenario(scenario, seed)));
}
