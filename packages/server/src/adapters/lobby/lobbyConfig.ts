import type { ConfigChanges, ConfigError, MatchConfig } from "@node-stream/shared";
import { validateConfig } from "../../core/config/index.js";

export type ConfigChangeResult =
  | { readonly ok: true; readonly config: MatchConfig }
  | { readonly ok: false; readonly errors: readonly ConfigError[] };

export function checkPlayerCount(config: MatchConfig, playerCount: number): ConfigError[] {
  if (config.maxPlayers >= playerCount) {
    return [];
  }
  return [{ parameter: "maxPlayers", message: `must be at least the number of players in the lobby (${playerCount})` }];
}

export function validateLobbyConfig(config: MatchConfig, playerCount: number): ConfigError[] {
  return [...validateConfig(config), ...checkPlayerCount(config, playerCount)];
}

export function applyConfigChanges(
  config: MatchConfig,
  changes: ConfigChanges,
  playerCount: number,
): ConfigChangeResult {
  const merged: MatchConfig = { ...config, ...changes };
  const errors = validateLobbyConfig(merged, playerCount);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, config: merged };
}
