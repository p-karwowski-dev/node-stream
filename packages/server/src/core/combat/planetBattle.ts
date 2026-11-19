import type { GameEvent, MatchConfig, PlanetId, PlayerId } from "@node-stream/shared";
import type { ShipDeque } from "../fleets/index.js";
import type { LinkRegistry } from "../links/index.js";
import type { PlanetRegistry } from "../planets/index.js";
import type { ShipRegistry } from "../ships/index.js";
export interface PlanetBattleContext {
  readonly config: MatchConfig;
  readonly planets: PlanetRegistry;
  readonly links: LinkRegistry;
  readonly ships: ShipRegistry;
}
function makeNeutral(planetId: PlanetId, oldOwnerId: PlayerId, context: PlanetBattleContext): GameEvent[] {
  const { planets, links } = context;
  const removed = links.removeLinksOwnedBy(planetId, oldOwnerId, (id) => planets.get(id)?.ownerId ?? null);
  planets.setOwner(planetId, null);
  links.resetCursor(planetId);
  return removed.map((link) => ({ type: "linkRemoved", from: link.from, to: link.to }));
}
function capture(planetId: PlanetId, attackerId: PlayerId, leftover: number, context: PlanetBattleContext): void {
  const { config, planets, links } = context;
  planets.setOwner(planetId, attackerId);
  links.resetCursor(planetId);
  planets.setPoints(planetId, config.capturePoints);
  planets.addPoints(planetId, (leftover - 1) * config.reinforcementPerShip);
}
export function resolvePlanetBattle(
  planetId: PlanetId,
  fleet: ShipDeque,
  attackerId: PlayerId,
  context: PlanetBattleContext,
): GameEvent[] {
  const { config, planets, ships } = context;
  const planet = planets.get(planetId);
  const attackers = fleet.length;
  if (planet === undefined || attackers === 0) {
    return [];
  }
  const damage = config.attackDamagePerShip;
  const used = Math.min(attackers, Math.ceil(planet.points / damage));
  const remainingPoints = Math.max(0, planet.points - used * damage);
  const oldOwnerId = planet.ownerId;
  planets.setPoints(planetId, remainingPoints);
  const events: GameEvent[] = [];
  if (remainingPoints === 0) {
    if (oldOwnerId !== null) {
      events.push(...makeNeutral(planetId, oldOwnerId, context));
    }
    const leftover = attackers - used;
    if (leftover >= 1) {
      capture(planetId, attackerId, leftover, context);
    }
  }
  fleet.clear();
  ships.retire(attackerId, attackers);
  return events;
}
