import type {
  GameEvent,
  MatchConfig,
  MatchEndReason,
  PlayerId,
  PlayerStanding,
} from "@node-stream/shared";
import type { PlanetRegistry } from "../planets/index.js";
import type { PlayerRoster } from "../players/index.js";
import type { ShipRegistry } from "../ships/index.js";
import { dominationThreshold } from "./dominationThreshold.js";
import { computeStandings, pickWinner } from "./standings.js";
export interface OutcomeContext {
  readonly config: MatchConfig;
  readonly tick: number;
  readonly players: PlayerRoster;
  readonly planets: PlanetRegistry;
  readonly ships: ShipRegistry;
}
export interface OutcomeResult {
  readonly events: GameEvent[];
  readonly ended: boolean;
}
const millisecondsPerSecond = 1000;
function eliminatePlayers(context: OutcomeContext): GameEvent[] {
  const { players, planets, ships } = context;
  const events: GameEvent[] = [];
  for (const player of players.all()) {
    if (
      player.claimed &&
      !player.eliminated &&
      planets.ownedCount(player.id) === 0 &&
      ships.aliveCount(player.id) === 0
    ) {
      players.markEliminated(player.id);
      events.push({ type: "playerEliminated", playerId: player.id });
    }
  }
  return events;
}
function endMatch(
  events: GameEvent[],
  winnerId: PlayerId | null,
  reason: MatchEndReason,
  standings: readonly PlayerStanding[]
): OutcomeResult {
  return {
    events: [...events, { type: "matchEnded", winnerId, reason, standings }],
    ended: true,
  };
}
function isTimeUp(config: MatchConfig, tick: number): boolean {
  return (
    tick * config.tickLengthMs >
    config.matchDurationSeconds * millisecondsPerSecond
  );
}
export function checkOutcome(context: OutcomeContext): OutcomeResult {
  const { config, tick, players, planets, ships } = context;
  const events = eliminatePlayers(context);
  const roster = players.all();
  if (roster.length > 0 && roster.every((player) => player.eliminated)) {
    return endMatch(
      events,
      null,
      "elimination",
      computeStandings(players, planets, ships)
    );
  }
  const threshold = dominationThreshold(config, planets.count);
  if (
    threshold !== null &&
    roster.some((player) => planets.ownedCount(player.id) >= threshold)
  ) {
    const standings = computeStandings(players, planets, ships);
    const candidates = standings.filter(
      (standing) => standing.planets >= threshold
    );
    return endMatch(events, pickWinner(candidates), "domination", standings);
  }
  if (isTimeUp(config, tick)) {
    const standings = computeStandings(players, planets, ships);
    const candidates = standings.filter(
      (standing) => players.get(standing.playerId)?.eliminated === false
    );
    return endMatch(events, pickWinner(candidates), "timer", standings);
  }
  return { events, ended: false };
}
