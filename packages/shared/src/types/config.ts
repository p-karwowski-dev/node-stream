export type GridPlanetDistribution = readonly [number, number, number];
export type RandomPlanetDistribution = number;
export type PlanetDistribution = GridPlanetDistribution | RandomPlanetDistribution;

export interface MatchConfig {
  readonly maxPlayers: number;
  readonly matchDurationSeconds: number;
  readonly startCountdownSeconds: number;
  readonly dominationPercent: number;
  readonly planetDistribution: PlanetDistribution;
  readonly minPlanetDistance: number;
  readonly minReachablePlanets: number;
  readonly mapScale: number;
  readonly maxHopDistance: number;
  readonly initialShipSpeed: number;
  readonly speedDecayPercent: number;
  readonly hopDelayTicks: number;
  readonly tickLengthMs: number;
  readonly productionIntervalTicks: number;
  readonly shipsPerProduction: number;
  readonly planetPointsMin: number;
  readonly planetPointsMax: number;
  readonly attackDamagePerShip: number;
  readonly reinforcementPerShip: number;
  readonly capturePoints: number;
  readonly seed: number;
  readonly unitToPixel: number;
}

export type MatchConfigParameter = keyof MatchConfig;

export interface ConfigError {
  readonly parameter: MatchConfigParameter;
  readonly message: string;
}
