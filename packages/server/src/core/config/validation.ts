import type { ConfigError, MatchConfig, MatchConfigParameter } from "@node-stream/shared";

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

function isIntegerAtLeast(value: number, minimum: number): boolean {
  return isInteger(value) && value >= minimum;
}

function isFiniteAtLeast(value: number, minimum: number): boolean {
  return Number.isFinite(value) && value >= minimum;
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isValidDistribution(distribution: MatchConfig["planetDistribution"]): boolean {
  if (typeof distribution === "number") {
    return isIntegerAtLeast(distribution, 1);
  }
  return distribution.length === 3 && distribution.every((count) => isIntegerAtLeast(count, 1));
}

interface Rule {
  readonly parameter: MatchConfigParameter;
  readonly message: string;
  readonly holds: (config: MatchConfig) => boolean;
}

const rules: readonly Rule[] = [
  { parameter: "maxPlayers", message: "must be an integer of at least 1", holds: (c) => isIntegerAtLeast(c.maxPlayers, 1) },
  { parameter: "matchDurationSeconds", message: "must be greater than 0", holds: (c) => isFinitePositive(c.matchDurationSeconds) },
  {
    parameter: "dominationPercent",
    message: "must be greater than 0 and at most 100",
    holds: (c) => isFinitePositive(c.dominationPercent) && c.dominationPercent <= 100,
  },
  {
    parameter: "planetDistribution",
    message: "must be three integers of at least 1 (grid) or one integer of at least 1 (random)",
    holds: (c) => isValidDistribution(c.planetDistribution),
  },
  { parameter: "minPlanetDistance", message: "must be greater than 0", holds: (c) => isFinitePositive(c.minPlanetDistance) },
  {
    parameter: "maxHopDistance",
    message: "must be at least minPlanetDistance",
    holds: (c) => Number.isFinite(c.maxHopDistance) && c.maxHopDistance >= c.minPlanetDistance,
  },
  { parameter: "minReachablePlanets", message: "must be an integer of at least 0", holds: (c) => isIntegerAtLeast(c.minReachablePlanets, 0) },
  { parameter: "mapScale", message: "must be at least 1", holds: (c) => isFiniteAtLeast(c.mapScale, 1) },
  { parameter: "initialShipSpeed", message: "must be greater than 0", holds: (c) => isFinitePositive(c.initialShipSpeed) },
  { parameter: "speedDecayPercent", message: "must be at least 0", holds: (c) => isFiniteAtLeast(c.speedDecayPercent, 0) },
  { parameter: "hopDelayTicks", message: "must be an integer of at least 0", holds: (c) => isIntegerAtLeast(c.hopDelayTicks, 0) },
  { parameter: "tickLengthMs", message: "must be an integer greater than 0", holds: (c) => isIntegerAtLeast(c.tickLengthMs, 1) },
  {
    parameter: "productionIntervalTicks",
    message: "must be an integer of at least 1",
    holds: (c) => isIntegerAtLeast(c.productionIntervalTicks, 1),
  },
  { parameter: "shipsPerProduction", message: "must be an integer of at least 1", holds: (c) => isIntegerAtLeast(c.shipsPerProduction, 1) },
  { parameter: "planetPointsMin", message: "must be an integer of at least 1", holds: (c) => isIntegerAtLeast(c.planetPointsMin, 1) },
  {
    parameter: "planetPointsMax",
    message: "must be an integer of at least planetPointsMin",
    holds: (c) => isInteger(c.planetPointsMax) && c.planetPointsMax >= c.planetPointsMin,
  },
  { parameter: "attackDamagePerShip", message: "must be an integer of at least 1", holds: (c) => isIntegerAtLeast(c.attackDamagePerShip, 1) },
  {
    parameter: "reinforcementPerShip",
    message: "must be an integer of at least 1",
    holds: (c) => isIntegerAtLeast(c.reinforcementPerShip, 1),
  },
  { parameter: "capturePoints", message: "must be an integer of at least 1", holds: (c) => isIntegerAtLeast(c.capturePoints, 1) },
  { parameter: "startCountdownSeconds", message: "must be at least 0", holds: (c) => isFiniteAtLeast(c.startCountdownSeconds, 0) },
  { parameter: "seed", message: "must be an integer", holds: (c) => isInteger(c.seed) },
  { parameter: "unitToPixel", message: "must be greater than 0", holds: (c) => isFinitePositive(c.unitToPixel) },
];

export function validateConfig(config: MatchConfig): ConfigError[] {
  return rules
    .filter((rule) => !rule.holds(config))
    .map((rule) => ({ parameter: rule.parameter, message: rule.message }));
}
