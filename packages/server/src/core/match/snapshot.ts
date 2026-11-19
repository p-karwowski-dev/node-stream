import type { MatchSnapshot } from "@node-stream/shared";
import type { MatchState } from "./matchState.js";
export function createSnapshot(state: MatchState): MatchSnapshot {
  const { planets, links, arrivals, players, fleets, ships } = state;
  return {
    tick: state.tick,
    status: state.status,
    planets: planets.all().map((planet) => ({
      id: planet.id,
      position: { x: planet.position.x, y: planet.position.y, z: planet.position.z },
      points: planet.points,
      maxPoints: planet.maxPoints,
      ownerId: planet.ownerId,
      shipsOnPlanet: fleets.shipsAt(planet.id),
    })),
    links: links.all().map((link) => ({ from: link.from, to: link.to })),
    ships: arrivals.all().map((entry) => ({
      shipId: entry.ship.id,
      ownerId: entry.ship.ownerId,
      from: entry.from,
      to: entry.to,
      departureTime: entry.departureTime,
      arrivalTime: entry.arrivalTime,
    })),
    players: players.all().map((player) => ({
      id: player.id,
      name: player.name,
      kind: player.kind,
      claimed: player.claimed,
      eliminated: player.eliminated,
      planets: planets.ownedCount(player.id),
      ships: ships.aliveCount(player.id),
    })),
  };
}
