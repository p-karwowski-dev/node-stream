import type { ConfigChanges, ConfigError, MatchConfig, MatchConfigParameter } from "@node-stream/shared";
export type ConfigDrafts = Readonly<Partial<Record<MatchConfigParameter, string>>>;
export type ConfigDraftResult =
  | { readonly ok: true; readonly changes: ConfigChanges }
  | { readonly ok: false; readonly errors: readonly ConfigError[] };
const notANumberText = "must be a number";
const notADistributionText = "must be one number or three numbers separated by commas";
const gridAxisCount = 3;
export function configParameters(config: MatchConfig): readonly MatchConfigParameter[] {
  return Object.keys(config) as MatchConfigParameter[];
}
export function formatConfigValue(value: MatchConfig[MatchConfigParameter]): string {
  return typeof value === "number" ? String(value) : value.join(",");
}
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === "") {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}
function parseDistribution(text: string): MatchConfig["planetDistribution"] | undefined {
  const parts = text.split(",").map(parseNumber);
  if (parts.some((part) => part === undefined)) {
    return undefined;
  }
  const [x, y, z] = parts;
  if (parts.length === 1 && x !== undefined) {
    return x;
  }
  if (parts.length === gridAxisCount && x !== undefined && y !== undefined && z !== undefined) {
    return [x, y, z];
  }
  return undefined;
}
export function parseConfigDrafts(config: MatchConfig, drafts: ConfigDrafts): ConfigDraftResult {
  const changes: Partial<Record<MatchConfigParameter, MatchConfig[MatchConfigParameter]>> = {};
  const errors: ConfigError[] = [];
  for (const parameter of configParameters(config)) {
    const text = drafts[parameter];
    if (text === undefined || text === formatConfigValue(config[parameter])) {
      continue;
    }
    const value = parameter === "planetDistribution" ? parseDistribution(text) : parseNumber(text);
    if (value === undefined) {
      errors.push({ parameter, message: parameter === "planetDistribution" ? notADistributionText : notANumberText });
      continue;
    }
    changes[parameter] = value;
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, changes: changes as ConfigChanges };
}
