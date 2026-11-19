import type { MatchConfig } from "@node-stream/shared";

export function createDefaultConfig(seed: number): MatchConfig {
  return {
    maxPlayers: 20,
    matchDurationSeconds: 300,
    startCountdownSeconds: 5,
    dominationPercent: 30,
    planetDistribution: [10, 10, 10],
    minPlanetDistance: 200,
    minReachablePlanets: 0,
    mapScale: 1,
    maxHopDistance: 400,
    initialShipSpeed: 200,
    speedDecayPercent: 10,
    hopDelayTicks: 0,
    tickLengthMs: 100,
    productionIntervalTicks: 10,
    shipsPerProduction: 1,
    planetPointsMin: 1,
    planetPointsMax: 50,
    attackDamagePerShip: 1,
    reinforcementPerShip: 1,
    capturePoints: 1,
    seed,
    unitToPixel: 10,
  };
}
