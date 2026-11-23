import type { Command } from "../types/commands.js";
import type { MatchConfig } from "../types/config.js";
import type { PlayerId } from "../types/ids.js";

export type ConfigChanges = Partial<MatchConfig>;

export interface JoinMessage {
  readonly type: "join";
  readonly name: string;
}

export interface ReconnectMessage {
  readonly type: "reconnect";
  readonly token: string;
}

export interface SetConfigMessage {
  readonly type: "setConfig";
  readonly changes: ConfigChanges;
}

export interface AddAiMessage {
  readonly type: "addAi";
  readonly strategy: string;
}

export interface RemoveAiMessage {
  readonly type: "removeAi";
  readonly playerId: PlayerId;
}

export interface StartMatchMessage {
  readonly type: "startMatch";
}

export type LobbyActionMessage = SetConfigMessage | AddAiMessage | RemoveAiMessage | StartMatchMessage;

export type ClientMessage = JoinMessage | ReconnectMessage | LobbyActionMessage | Command;
