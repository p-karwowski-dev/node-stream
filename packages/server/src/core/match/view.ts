import type { MatchConfig, PlanetId, PlayerId } from "@node-stream/shared";
import type { PlanetView } from "../planets/index.js";
import type { PlayerView } from "../players/index.js";
import type { HopTarget } from "../world/index.js";
import type { MatchState } from "./matchState.js";
export interface MatchView {
  readonly config: MatchConfig;
  tick(): number;
  planet(id: PlanetId): PlanetView | undefined;
  planets(): readonly PlanetView[];
  outgoingTargets(planetId: PlanetId): readonly PlanetId[];
  planetsInRange(planetId: PlanetId): readonly HopTarget[];
  player(id: PlayerId): PlayerView | undefined;
}
export function createMatchView(state: MatchState): MatchView {
  return {
    config: state.config,
    tick: () => state.tick,
    planet: (id) => state.planets.get(id),
    planets: () => state.planets.all(),
    outgoingTargets: (planetId) => state.links.outgoing(planetId).map((link) => link.to),
    planetsInRange: (planetId) => state.links.targetsInRange(planetId),
    player: (id) => state.players.get(id),
  };
}
