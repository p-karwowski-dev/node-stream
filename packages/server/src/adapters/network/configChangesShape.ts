import type { ConfigChanges } from "@node-stream/shared";
import { createDefaultConfig } from "../../core/config/index.js";
import { isPlainObject } from "./messageShape.js";

const knownParameters = new Set<string>(Object.keys(createDefaultConfig(0)));
const planetDistributionParameter = "planetDistribution";

function isNumberArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isAcceptedValue(key: string, value: unknown): boolean {
  if (typeof value === "number") {
    return true;
  }
  return key === planetDistributionParameter && isNumberArray(value);
}

export function parseConfigChanges(value: unknown): ConfigChanges | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  const accepted = entries.every(([key, item]) => knownParameters.has(key) && isAcceptedValue(key, item));
  return accepted ? (Object.fromEntries(entries) as ConfigChanges) : undefined;
}
