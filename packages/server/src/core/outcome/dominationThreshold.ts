import type { MatchConfig } from "@node-stream/shared";
const percentScale = 100;
const minimumDominationPlanets = 2;
export function dominationThreshold(config: MatchConfig, planetCount: number): number | null {
  if (planetCount < minimumDominationPlanets) {
    return null;
  }
  return Math.max(
    minimumDominationPlanets,
    Math.floor((config.dominationPercent * planetCount) / percentScale),
  );
}
