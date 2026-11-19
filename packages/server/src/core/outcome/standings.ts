import type { PlayerId, PlayerStanding } from "@node-stream/shared";
import type { PlanetRegistry } from "../planets/index.js";
import type { PlayerRoster } from "../players/index.js";
import type { ShipRegistry } from "../ships/index.js";
interface PlanetTotals {
  planets: number;
  planetPoints: number;
  maxPlanetPoints: number;
}
export function compareStandings(first: PlayerStanding, second: PlayerStanding): number {
  return (
    first.planets - second.planets ||
    first.planetPoints - second.planetPoints ||
    first.maxPlanetPoints - second.maxPlanetPoints ||
    first.ships - second.ships
  );
}
export function computeStandings(
  players: PlayerRoster,
  planets: PlanetRegistry,
  ships: ShipRegistry,
): PlayerStanding[] {
  const totals = new Map<PlayerId, PlanetTotals>();
  for (const planet of planets.all()) {
    if (planet.ownerId === null) {
      continue;
    }
    const current = totals.get(planet.ownerId) ?? { planets: 0, planetPoints: 0, maxPlanetPoints: 0 };
    current.planets += 1;
    current.planetPoints += planet.points;
    current.maxPlanetPoints += planet.maxPoints;
    totals.set(planet.ownerId, current);
  }
  return players
    .all()
    .map((player) => {
      const owned = totals.get(player.id);
      return {
        playerId: player.id,
        planets: owned?.planets ?? 0,
        planetPoints: owned?.planetPoints ?? 0,
        maxPlanetPoints: owned?.maxPlanetPoints ?? 0,
        ships: ships.aliveCount(player.id),
      };
    })
    .sort((first, second) => compareStandings(second, first));
}
export function pickWinner(rankedCandidates: readonly PlayerStanding[]): PlayerId | null {
  const [leader, runnerUp] = rankedCandidates;
  if (leader === undefined) {
    return null;
  }
  if (runnerUp !== undefined && compareStandings(leader, runnerUp) === 0) {
    return null;
  }
  return leader.playerId;
}
