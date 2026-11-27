import type {
  MatchStartedMessage,
  PlanetId,
  PlanetSnapshot,
  PlayerId,
  PlayerSnapshot,
  SnapshotMessage,
} from "@node-stream/shared";
import type { MatchView } from "./clientState.js";
const millisecondsPerSecond = 1000;
export function indexPlanets(planets: readonly PlanetSnapshot[]): ReadonlyMap<PlanetId, number> {
  return new Map(planets.map((planet, index) => [planet.id, index]));
}
function hasPlayerClaimed(
  players: readonly PlayerSnapshot[],
  planets: readonly PlanetSnapshot[],
  myId: PlayerId,
): boolean {
  const me = players.find((player) => player.id === myId);
  return (me?.claimed ?? false) || planets.some((planet) => planet.ownerId === myId);
}
export function fromMatchStarted(
  message: MatchStartedMessage,
  receivedAt: number,
  myId: PlayerId,
  worldKey: number,
): MatchView {
  return {
    config: message.config,
    players: message.players,
    planets: message.planets,
    planetIndex: indexPlanets(message.planets),
    links: message.links,
    ships: [],
    tick: 0,
    tickReceivedAt: receivedAt,
    countdownEndsAt: receivedAt + message.countdownSeconds * millisecondsPerSecond,
    hasClaimed: hasPlayerClaimed(message.players, message.planets, myId),
    result: null,
    worldKey,
  };
}
export function fromSnapshot(message: SnapshotMessage, receivedAt: number, myId: PlayerId, worldKey: number): MatchView {
  return {
    config: message.config,
    players: message.players,
    planets: message.planets,
    planetIndex: indexPlanets(message.planets),
    links: message.links,
    ships: message.ships,
    tick: message.tick,
    tickReceivedAt: receivedAt,
    countdownEndsAt: null,
    hasClaimed: hasPlayerClaimed(message.players, message.planets, myId),
    result: message.result,
    worldKey,
  };
}
