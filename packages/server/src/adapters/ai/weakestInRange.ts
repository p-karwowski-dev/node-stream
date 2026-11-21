import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { MatchView } from "../../core/match/index.js";
import type { CommandIntent, Strategy } from "./strategy.js";
const defaultDecisionIntervalTicks = 10;
interface TargetCandidate {
  readonly id: PlanetId;
  readonly points: number;
}
function isWeakerCandidate(candidate: TargetCandidate, best: TargetCandidate | undefined): boolean {
  if (best === undefined) {
    return true;
  }
  if (candidate.points !== best.points) {
    return candidate.points < best.points;
  }
  return candidate.id < best.id;
}
function weakestUnownedInRange(view: MatchView, planetId: PlanetId, playerId: PlayerId): TargetCandidate | undefined {
  let weakest: TargetCandidate | undefined;
  for (const target of view.planetsInRange(planetId)) {
    const planet = view.planet(target.planetId);
    if (planet === undefined || planet.ownerId === playerId) {
      continue;
    }
    const candidate = { id: planet.id, points: planet.points };
    if (isWeakerCandidate(candidate, weakest)) {
      weakest = candidate;
    }
  }
  return weakest;
}
function decideForPlanet(view: MatchView, planetId: PlanetId, playerId: PlayerId): CommandIntent[] {
  const intents: CommandIntent[] = [];
  let keptLinks = 0;
  for (const to of view.outgoingTargets(planetId)) {
    if (view.planet(to)?.ownerId === playerId) {
      intents.push({ type: "removeLink", from: planetId, to });
    } else {
      keptLinks += 1;
    }
  }
  if (keptLinks > 0) {
    return intents;
  }
  const target = weakestUnownedInRange(view, planetId, playerId);
  if (target !== undefined) {
    intents.push({ type: "createLink", from: planetId, to: target.id });
  }
  return intents;
}
export const weakestInRange: Strategy = {
  name: "weakestInRange",
  decisionIntervalTicks: defaultDecisionIntervalTicks,
  decide: (view, playerId) =>
    view
      .planets()
      .filter((planet) => planet.ownerId === playerId)
      .flatMap((planet) => decideForPlanet(view, planet.id, playerId)),
};
