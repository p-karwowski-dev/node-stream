import type { CreateLinkCommand, GameEvent, PlayerId, RemoveLinkCommand } from "@node-stream/shared";
import { rejectCommand } from "./commandContext.js";
import type { CommandContext } from "./commandContext.js";
export function applyCreateLink(
  playerId: PlayerId,
  command: CreateLinkCommand,
  context: CommandContext,
): GameEvent[] {
  const { planets, links } = context;
  const { commandId, from, to } = command;
  const source = planets.get(from);
  const target = planets.get(to);
  if (source === undefined || target === undefined || from === to) {
    return [rejectCommand(commandId, "invalidPlanet")];
  }
  if (source.ownerId !== playerId) {
    return [rejectCommand(commandId, "notOwner")];
  }
  const length = links.rangeLength(from, to);
  if (length === undefined) {
    return [rejectCommand(commandId, "outOfRange")];
  }
  if (links.has(from, to)) {
    return [rejectCommand(commandId, "linkExists")];
  }
  const events: GameEvent[] = [];
  if (target.ownerId === playerId && links.remove(to, from)) {
    events.push({ type: "linkRemoved", from: to, to: from });
  }
  links.add(from, to, length);
  events.push({ type: "linkCreated", from, to });
  return events;
}
export function applyRemoveLink(
  playerId: PlayerId,
  command: RemoveLinkCommand,
  context: CommandContext,
): GameEvent[] {
  const { planets, links } = context;
  const { commandId, from, to } = command;
  const source = planets.get(from);
  if (source === undefined || planets.get(to) === undefined) {
    return [rejectCommand(commandId, "invalidPlanet")];
  }
  if (source.ownerId !== playerId) {
    return [rejectCommand(commandId, "notOwner")];
  }
  if (!links.remove(from, to)) {
    return [rejectCommand(commandId, "linkMissing")];
  }
  return [{ type: "linkRemoved", from, to }];
}
