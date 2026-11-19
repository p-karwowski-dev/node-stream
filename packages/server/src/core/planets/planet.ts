import type { PlanetId, PlayerId, Vector3 } from "@node-stream/shared";
export interface PlanetView {
  readonly id: PlanetId;
  readonly position: Vector3;
  readonly points: number;
  readonly maxPoints: number;
  readonly ownerId: PlayerId | null;
}
export function isRogue(planet: PlanetView): boolean {
  return planet.ownerId === null && planet.points > 0;
}
export function isNeutral(planet: PlanetView): boolean {
  return planet.ownerId === null && planet.points === 0;
}
