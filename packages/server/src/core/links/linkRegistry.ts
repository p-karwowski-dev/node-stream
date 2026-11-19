import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { HopTarget } from "../world/index.js";
export interface Link {
  readonly from: PlanetId;
  readonly to: PlanetId;
  readonly length: number;
}
interface PlanetLinks {
  readonly targetsInRange: readonly HopTarget[];
  readonly rangeLengths: ReadonlyMap<PlanetId, number>;
  readonly outgoing: Link[];
  readonly outgoingByTarget: Map<PlanetId, Link>;
  readonly incomingSources: Set<PlanetId>;
  cursor: number;
}
export interface LinkRegistry {
  rangeLength(from: PlanetId, to: PlanetId): number | undefined;
  targetsInRange(from: PlanetId): readonly HopTarget[];
  has(from: PlanetId, to: PlanetId): boolean;
  outgoing(from: PlanetId): readonly Link[];
  add(from: PlanetId, to: PlanetId, length: number): void;
  remove(from: PlanetId, to: PlanetId): boolean;
  nextDeparture(from: PlanetId): Link | undefined;
  resetCursor(from: PlanetId): void;
  removeLinksOwnedBy(
    planetId: PlanetId,
    oldOwnerId: PlayerId,
    ownerOf: (id: PlanetId) => PlayerId | null,
  ): Link[];
  all(): Link[];
}
const noCursor = -1;
export function createLinkRegistry(hopTargets: readonly (readonly HopTarget[])[]): LinkRegistry {
  const planets: PlanetLinks[] = hopTargets.map((targets) => ({
    targetsInRange: targets,
    rangeLengths: new Map(targets.map((target) => [target.planetId, target.length])),
    outgoing: [],
    outgoingByTarget: new Map(),
    incomingSources: new Set(),
    cursor: noCursor,
  }));
  function has(from: PlanetId, to: PlanetId): boolean {
    return planets[from]?.outgoingByTarget.has(to) ?? false;
  }
  function add(from: PlanetId, to: PlanetId, length: number): void {
    const source = planets[from];
    const target = planets[to];
    if (source === undefined || target === undefined || source.outgoingByTarget.has(to)) {
      return;
    }
    const link: Link = { from, to, length };
    source.outgoing.push(link);
    source.outgoingByTarget.set(to, link);
    target.incomingSources.add(from);
  }
  function remove(from: PlanetId, to: PlanetId): boolean {
    const source = planets[from];
    const link = source?.outgoingByTarget.get(to);
    if (source === undefined || link === undefined) {
      return false;
    }
    const index = source.outgoing.indexOf(link);
    source.outgoing.splice(index, 1);
    source.outgoingByTarget.delete(to);
    planets[to]?.incomingSources.delete(from);
    if (index <= source.cursor) {
      source.cursor -= 1;
    }
    return true;
  }
  function nextDeparture(from: PlanetId): Link | undefined {
    const source = planets[from];
    if (source === undefined || source.outgoing.length === 0) {
      return undefined;
    }
    const candidate = source.cursor + 1;
    const targetIndex = candidate >= source.outgoing.length ? 0 : candidate;
    source.cursor = targetIndex;
    return source.outgoing[targetIndex];
  }
  function resetCursor(from: PlanetId): void {
    const source = planets[from];
    if (source !== undefined) {
      source.cursor = noCursor;
    }
  }
  function removeLinksOwnedBy(
    planetId: PlanetId,
    oldOwnerId: PlayerId,
    ownerOf: (id: PlanetId) => PlayerId | null,
  ): Link[] {
    const planet = planets[planetId];
    if (planet === undefined) {
      return [];
    }
    const removedOutgoing = [...planet.outgoing];
    removedOutgoing.forEach((link) => remove(link.from, link.to));
    const ownedSources = [...planet.incomingSources]
      .filter((source) => ownerOf(source) === oldOwnerId)
      .sort((first, second) => first - second);
    const removedIncoming = ownedSources.flatMap((source) => {
      const link = planets[source]?.outgoingByTarget.get(planetId);
      if (link === undefined) {
        return [];
      }
      remove(source, planetId);
      return [link];
    });
    return [...removedOutgoing, ...removedIncoming];
  }
  function all(): Link[] {
    return planets.flatMap((planet) => planet.outgoing);
  }
  return {
    rangeLength: (from, to) => planets[from]?.rangeLengths.get(to),
    targetsInRange: (from) => planets[from]?.targetsInRange ?? [],
    has,
    outgoing: (from) => planets[from]?.outgoing ?? [],
    add,
    remove,
    nextDeparture,
    resetCursor,
    removeLinksOwnedBy,
    all,
  };
}
