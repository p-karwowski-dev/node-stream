import type { LinkSnapshot, PlanetId, PlanetSnapshot, PlayerId, Vector3 } from "@node-stream/shared";
import type { MatchView } from "./clientState.js";
export type PlanetRelation = "own" | "enemy" | "unowned";
export function planetName(id: PlanetId): string {
  return `Planet ${id}`;
}
export function planetRelation(ownerId: PlayerId | null, myId: PlayerId): PlanetRelation {
  if (ownerId === null) {
    return "unowned";
  }
  return ownerId === myId ? "own" : "enemy";
}
export function isRogue(planet: PlanetSnapshot): boolean {
  return planet.ownerId === null && planet.points >= 1;
}
export function findPlanet(match: MatchView, id: PlanetId): PlanetSnapshot | undefined {
  const index = match.planetIndex.get(id);
  return index === undefined ? undefined : match.planets[index];
}
export function distanceBetween(a: Vector3, b: Vector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
export function isInHopRange(match: MatchView, from: PlanetSnapshot, to: PlanetSnapshot): boolean {
  return from.id !== to.id && distanceBetween(from.position, to.position) <= match.config.maxHopDistance;
}
export function outgoingLinks(match: MatchView, sourceId: PlanetId): readonly LinkSnapshot[] {
  return match.links.filter((link) => link.from === sourceId);
}
export function planetsInRange(match: MatchView, sourceId: PlanetId): readonly PlanetSnapshot[] {
  const source = findPlanet(match, sourceId);
  if (source === undefined) {
    return [];
  }
  const linkedTargets = new Set(outgoingLinks(match, sourceId).map((link) => link.to));
  return match.planets.filter((planet) => !linkedTargets.has(planet.id) && isInHopRange(match, source, planet));
}
