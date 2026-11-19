import type { CommandId, CommandRejectedEvent, CommandRejectionReason } from "@node-stream/shared";
import type { LinkRegistry } from "../links/index.js";
import type { PlanetRegistry } from "../planets/index.js";
import type { PlayerRoster } from "../players/index.js";
export interface CommandContext {
  readonly planets: PlanetRegistry;
  readonly links: LinkRegistry;
  readonly players: PlayerRoster;
}
export function rejectCommand(commandId: CommandId, reason: CommandRejectionReason): CommandRejectedEvent {
  return { type: "commandRejected", commandId, reason };
}
