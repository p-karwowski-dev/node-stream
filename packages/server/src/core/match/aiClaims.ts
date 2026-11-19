import { isRogue } from "../planets/index.js";
import { createStream } from "../random/index.js";
import type { MatchState } from "./matchState.js";
export const aiClaimsStreamName = "aiClaims";
export function claimStartingPlanetsForAi(state: MatchState): void {
  const { config, planets, links, players } = state;
  const stream = createStream(config.seed, aiClaimsStreamName);
  const roguePlanetIds = planets
    .all()
    .filter(isRogue)
    .map((planet) => planet.id);
  for (const player of players.all()) {
    if (player.kind !== "ai") {
      continue;
    }
    if (roguePlanetIds.length === 0) {
      return;
    }
    const index = stream.nextInt(0, roguePlanetIds.length - 1);
    const [planetId] = roguePlanetIds.splice(index, 1);
    if (planetId === undefined) {
      return;
    }
    planets.setOwner(planetId, player.id);
    links.resetCursor(planetId);
    players.markClaimed(player.id);
  }
}
