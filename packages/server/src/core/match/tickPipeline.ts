import type { GameEvent, TickResult } from "@node-stream/shared";
import { deliverArrivals } from "../arrivals/index.js";
import { applyCommands } from "../commands/index.js";
import { runProduction } from "../dispatch/index.js";
import { checkOutcome } from "../outcome/index.js";
import type { MatchState } from "./matchState.js";
import { runPlanetPhases } from "./planetPhases.js";
function appendEvents(target: GameEvent[], source: readonly GameEvent[]): void {
  for (const event of source) {
    target.push(event);
  }
}
function planetChangedEvents(state: MatchState): GameEvent[] {
  return state.planets.drainChanged().flatMap((planetId) => {
    const planet = state.planets.get(planetId);
    return planet === undefined
      ? []
      : [{ type: "planetChanged" as const, planetId, ownerId: planet.ownerId, points: planet.points }];
  });
}
export function runTick(state: MatchState): TickResult {
  if (state.status === "ended") {
    return { tick: state.tick, events: [] };
  }
  state.tick += 1;
  const { tick, config } = state;
  const events: GameEvent[] = [];
  appendEvents(events, applyCommands(state.commands.drain(), state));
  deliverArrivals(tick, config, state.arrivals, state.fleets);
  runProduction(tick, config, state.planets, state.fleets, state.ships);
  appendEvents(events, runPlanetPhases(state, tick));
  appendEvents(events, planetChangedEvents(state));
  const outcome = checkOutcome({
    config,
    tick,
    players: state.players,
    planets: state.planets,
    ships: state.ships,
  });
  appendEvents(events, outcome.events);
  if (outcome.ended) {
    state.status = "ended";
  }
  return { tick, events };
}
