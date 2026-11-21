import type { MatchConfig } from "@node-stream/shared";
export interface BenchmarkScenario {
  readonly name: string;
  readonly overrides: Partial<MatchConfig>;
}
export const benchmarkScenarios: readonly BenchmarkScenario[] = [
  { name: "default", overrides: {} },
  { name: "grid 15x15x15", overrides: { planetDistribution: [15, 15, 15] } },
  { name: "grid 20x20x20", overrides: { planetDistribution: [20, 20, 20] } },
];
export const benchmarkDefaultSeed = 1;
