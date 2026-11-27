import type { ShipInFlightSnapshot } from "@node-stream/shared";
import type { MatchView } from "./clientState.js";
const millisecondsPerSecond = 1000;
export function displayMatchTime(match: MatchView, now: number): number {
  const tickTime = match.tick * match.config.tickLengthMs;
  if (match.tick === 0 || match.result !== null) {
    return tickTime;
  }
  return tickTime + Math.min(Math.max(now - match.tickReceivedAt, 0), match.config.tickLengthMs);
}
export function shipProgress(ship: ShipInFlightSnapshot, matchTime: number): number {
  const duration = ship.arrivalTime - ship.departureTime;
  if (duration <= 0) {
    return 1;
  }
  return Math.min(Math.max((matchTime - ship.departureTime) / duration, 0), 1);
}
export function countdownRemainingSeconds(match: MatchView, now: number): number | null {
  if (match.countdownEndsAt === null) {
    return null;
  }
  return Math.max(0, Math.ceil((match.countdownEndsAt - now) / millisecondsPerSecond));
}
