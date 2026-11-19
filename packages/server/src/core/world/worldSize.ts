import type { MatchConfig } from "@node-stream/shared";

export const randomPlacementSizeFactor = 1.25;
export const placementAttemptsPerPlanet = 200;

function smallestCubeRootCeiling(count: number): number {
  let root = 1;
  while (root * root * root < count) {
    root += 1;
  }
  return root;
}

export function computeWorldSide(config: MatchConfig): number {
  const { planetDistribution, minPlanetDistance, mapScale } = config;
  if (typeof planetDistribution === "number") {
    const baseSize = smallestCubeRootCeiling(planetDistribution) * minPlanetDistance * randomPlacementSizeFactor;
    return baseSize * mapScale;
  }
  const largestAxisCount = Math.max(...planetDistribution);
  return largestAxisCount * minPlanetDistance * mapScale;
}
