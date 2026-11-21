import { parseArgs } from "node:util";
import type { MatchConfig, PlayerId } from "@node-stream/shared";
import { weakestInRange } from "../adapters/ai/index.js";
import { validateConfig } from "../core/config/index.js";
import { MatchSetupError } from "../core/match/index.js";
import { CliError } from "./cliError.js";
import {
  buildMatchConfig,
  loadConfigOverrides,
  resolveSeed,
} from "./configFile.js";
import { runHeadlessMatch } from "./headlessMatch.js";
import type { HeadlessMatchReport } from "./headlessMatch.js";
import { parseIntegerOption, parseOptions } from "./options.js";
import { millisecondsPerSecond } from "./timeUnits.js";
const defaultAiPlayerCount = 4;
const minimumAiPlayerCount = 1;
const decimalsForSimulatedSeconds = 1;
const decimalsForMilliseconds = 1;
const noWinnerName = "none (draw)";
function resolveAiPlayerCount(
  value: string | undefined,
  config: MatchConfig
): number {
  const count = parseIntegerOption("ai-players", value) ?? defaultAiPlayerCount;
  if (count < minimumAiPlayerCount || count > config.maxPlayers) {
    throw new CliError(
      `--ai-players must be an integer from ${minimumAiPlayerCount} to ${config.maxPlayers}`
    );
  }
  return count;
}
function playerName(
  report: HeadlessMatchReport,
  playerId: PlayerId | null
): string {
  return (
    report.players.find((player) => player.id === playerId)?.name ??
    noWinnerName
  );
}
function printReport(
  report: HeadlessMatchReport,
  config: MatchConfig,
  strategyName: string
): void {
  const { ending, lastTick } = report;
  const simulatedSeconds = (
    (lastTick * config.tickLengthMs) /
    millisecondsPerSecond
  ).toFixed(decimalsForSimulatedSeconds);
  const ticksPerSecond = Math.round(
    lastTick / (report.runMilliseconds / millisecondsPerSecond)
  );
  const setupMilliseconds = report.setupMilliseconds.toFixed(
    decimalsForMilliseconds
  );
  const runMilliseconds = report.runMilliseconds.toFixed(
    decimalsForMilliseconds
  );
  const winner = playerName(report, ending.winnerId);
  console.log(
    `seed ${config.seed}, planets ${report.planetCount}, AI players ${report.players.length} (${strategyName})`
  );
  console.log(
    `ended at tick ${lastTick} (${simulatedSeconds} s simulated): ${ending.reason}, winner ${winner}`
  );
  console.table(
    ending.standings.map((standing) => ({
      player: playerName(report, standing.playerId),
      planets: standing.planets,
      planetPoints: standing.planetPoints,
      maxPlanetPoints: standing.maxPlanetPoints,
      ships: standing.ships,
    }))
  );
  console.log(
    `setup ${setupMilliseconds} ms, run ${runMilliseconds} ms, ${ticksPerSecond} ticks per second`
  );
  console.log(`command log: ${report.commandLogEntries} commands`);
}
export function runMatchCommand(args: string[]): void {
  const values = parseOptions(
    () =>
      parseArgs({
        args,
        options: {
          config: { type: "string" },
          seed: { type: "string" },
          "ai-players": { type: "string" },
        },
        strict: true,
        allowPositionals: false,
      }).values
  );
  const overrides =
    values.config === undefined ? {} : loadConfigOverrides(values.config);
  const seed = resolveSeed(
    parseIntegerOption("seed", values.seed),
    overrides.seed
  );
  const config = buildMatchConfig(overrides, seed);
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    throw new MatchSetupError("invalidConfig", configErrors);
  }
  const aiPlayerCount = resolveAiPlayerCount(values["ai-players"], config);
  const report = runHeadlessMatch({ config, aiPlayerCount });
  printReport(report, config, weakestInRange.name);
}
