import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import type { MatchConfig } from "@node-stream/shared";
import { createDefaultConfig } from "../core/config/index.js";
import { CliError } from "./cliError.js";
const seedUpperBoundExclusive = 2 ** 31;
const knownParameters = new Set<string>(Object.keys(createDefaultConfig(0)));
const planetDistributionParameter = "planetDistribution";
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNumberArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}
function describeProblem(key: string, value: unknown): string | undefined {
  if (!knownParameters.has(key)) {
    return `${key} is not a config parameter`;
  }
  if (typeof value === "number") {
    return undefined;
  }
  if (key === planetDistributionParameter) {
    return isNumberArray(value) ? undefined : `${key} must be a number or an array of numbers`;
  }
  return `${key} must be a number`;
}
function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new CliError(`Cannot read config file ${path}: ${reason}`);
  }
}
export function loadConfigOverrides(path: string): Partial<MatchConfig> {
  const content = readJson(path);
  if (!isPlainObject(content)) {
    throw new CliError(`Config file ${path} must contain a JSON object`);
  }
  const problems = Object.entries(content).flatMap(([key, value]) => describeProblem(key, value) ?? []);
  if (problems.length > 0) {
    throw new CliError(`Config file ${path}: ${problems.join("; ")}`);
  }
  return content as Partial<MatchConfig>;
}
export function resolveSeed(flagSeed: number | undefined, fileSeed: number | undefined): number {
  return flagSeed ?? fileSeed ?? randomInt(seedUpperBoundExclusive);
}
export function buildMatchConfig(overrides: Partial<MatchConfig>, seed: number): MatchConfig {
  return { ...createDefaultConfig(seed), ...overrides, seed };
}
