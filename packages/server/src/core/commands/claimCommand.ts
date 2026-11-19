import type { ClaimPlanetCommand, GameEvent, PlayerId } from "@node-stream/shared";
import { isRogue } from "../planets/index.js";
import { rejectCommand } from "./commandContext.js";
import type { CommandContext } from "./commandContext.js";
export function applyClaimPlanet(
  playerId: PlayerId,
  command: ClaimPlanetCommand,
  context: CommandContext,
): GameEvent[] {
  const { planets, links, players } = context;
  const planet = planets.get(command.planetId);
  const player = players.get(playerId);
  if (planet === undefined) {
    return [rejectCommand(command.commandId, "invalidPlanet")];
  }
  if (player === undefined || player.claimed) {
    return [rejectCommand(command.commandId, "alreadyClaimed")];
  }
  if (!isRogue(planet)) {
    return [rejectCommand(command.commandId, "planetTaken")];
  }
  planets.setOwner(planet.id, playerId);
  links.resetCursor(planet.id);
  players.markClaimed(playerId);
  return [];
}
