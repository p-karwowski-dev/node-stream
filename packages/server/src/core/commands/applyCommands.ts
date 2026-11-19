import type { GameEvent } from "@node-stream/shared";
import { applyClaimPlanet } from "./claimCommand.js";
import type { CommandContext } from "./commandContext.js";
import type { QueuedCommand } from "./commandQueue.js";
import { applyCreateLink, applyRemoveLink } from "./linkCommands.js";
function applyCommand(entry: QueuedCommand, context: CommandContext): GameEvent[] {
  const { playerId, command } = entry;
  switch (command.type) {
    case "claimPlanet":
      return applyClaimPlanet(playerId, command, context);
    case "createLink":
      return applyCreateLink(playerId, command, context);
    case "removeLink":
      return applyRemoveLink(playerId, command, context);
  }
}
export function applyCommands(entries: readonly QueuedCommand[], context: CommandContext): GameEvent[] {
  const events: GameEvent[] = [];
  for (const entry of entries) {
    for (const event of applyCommand(entry, context)) {
      events.push(event);
    }
  }
  return events;
}
