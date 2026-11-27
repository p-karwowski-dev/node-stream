import type {
  CommandRejectedEvent,
  LinkSnapshot,
  PlanetSnapshot,
  PlayerId,
  PlayerSnapshot,
  ShipInFlightSnapshot,
  TickMessage,
} from "@node-stream/shared";
import type { MatchView } from "./clientState.js";
export interface TickOutcome {
  readonly match: MatchView;
  readonly rejected: readonly CommandRejectedEvent[];
}
export function applyTick(match: MatchView, message: TickMessage, receivedAt: number, myId: PlayerId): TickOutcome {
  const matchTime = message.tick * match.config.tickLengthMs;
  const departed: ShipInFlightSnapshot[] = [];
  const rejected: CommandRejectedEvent[] = [];
  let planets: PlanetSnapshot[] | null = null;
  let links: readonly LinkSnapshot[] = match.links;
  let players: readonly PlayerSnapshot[] = match.players;
  let hasClaimed = match.hasClaimed;
  let result = match.result;
  for (const event of message.events) {
    switch (event.type) {
      case "shipDeparted":
        departed.push({
          shipId: event.shipId,
          ownerId: event.ownerId,
          from: event.from,
          to: event.to,
          departureTime: event.departureTime,
          arrivalTime: event.arrivalTime,
        });
        break;
      case "planetChanged": {
        const index = match.planetIndex.get(event.planetId);
        const current = index === undefined ? undefined : (planets ?? match.planets)[index];
        if (index === undefined || current === undefined) {
          break;
        }
        planets ??= [...match.planets];
        planets[index] = { ...current, ownerId: event.ownerId, points: event.points };
        hasClaimed ||= event.ownerId === myId;
        break;
      }
      case "linkCreated":
        links = [...links, { from: event.from, to: event.to }];
        break;
      case "linkRemoved":
        links = links.filter((link) => link.from !== event.from || link.to !== event.to);
        break;
      case "playerEliminated":
        players = players.map((player) => (player.id === event.playerId ? { ...player, eliminated: true } : player));
        break;
      case "matchEnded":
        result = event;
        break;
      case "commandRejected":
        rejected.push(event);
        break;
    }
  }
  const remaining = match.ships.filter((ship) => ship.arrivalTime > matchTime);
  return {
    match: {
      ...match,
      planets: planets ?? match.planets,
      links,
      players,
      ships: departed.length === 0 ? remaining : [...remaining, ...departed],
      tick: message.tick,
      tickReceivedAt: receivedAt,
      countdownEndsAt: null,
      hasClaimed,
      result,
    },
    rejected,
  };
}
