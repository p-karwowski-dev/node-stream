import type { PlanetId, PlayerId, Vector3 } from "@node-stream/shared";
import type { World } from "../world/index.js";
import type { PlanetView } from "./planet.js";
interface PlanetState {
  readonly id: PlanetId;
  readonly position: Vector3;
  points: number;
  readonly maxPoints: number;
  ownerId: PlayerId | null;
}
export interface PlanetRegistry {
  readonly count: number;
  get(id: PlanetId): PlanetView | undefined;
  all(): readonly PlanetView[];
  ownedCount(playerId: PlayerId): number;
  setPoints(id: PlanetId, points: number): void;
  addPoints(id: PlanetId, amount: number): void;
  setOwner(id: PlanetId, ownerId: PlayerId | null): void;
  drainChanged(): PlanetId[];
}
export function createPlanetRegistry(world: World): PlanetRegistry {
  const planets: PlanetState[] = world.planets.map((planet) => ({
    id: planet.id,
    position: planet.position,
    points: planet.points,
    maxPoints: planet.points,
    ownerId: null,
  }));
  const ownedCounts = new Map<PlayerId, number>();
  const changed = new Set<PlanetId>();
  function setPoints(id: PlanetId, points: number): void {
    const planet = planets[id];
    if (planet === undefined) {
      return;
    }
    const clamped = Math.min(planet.maxPoints, Math.max(0, points));
    if (clamped !== planet.points) {
      planet.points = clamped;
      changed.add(id);
    }
  }
  function addPoints(id: PlanetId, amount: number): void {
    const planet = planets[id];
    if (planet !== undefined) {
      setPoints(id, planet.points + amount);
    }
  }
  function adjustOwnedCount(playerId: PlayerId, delta: number): void {
    ownedCounts.set(playerId, (ownedCounts.get(playerId) ?? 0) + delta);
  }
  function setOwner(id: PlanetId, ownerId: PlayerId | null): void {
    const planet = planets[id];
    if (planet === undefined || planet.ownerId === ownerId) {
      return;
    }
    if (planet.ownerId !== null) {
      adjustOwnedCount(planet.ownerId, -1);
    }
    if (ownerId !== null) {
      adjustOwnedCount(ownerId, 1);
    }
    planet.ownerId = ownerId;
    changed.add(id);
  }
  function drainChanged(): PlanetId[] {
    const ids = [...changed].sort((first, second) => first - second);
    changed.clear();
    return ids;
  }
  return {
    count: planets.length,
    get: (id) => planets[id],
    all: () => planets,
    ownedCount: (playerId) => ownedCounts.get(playerId) ?? 0,
    setPoints,
    addPoints,
    setOwner,
    drainChanged,
  };
}
