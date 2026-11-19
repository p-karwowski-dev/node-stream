import type {
  Command,
  MatchConfig,
  MatchSnapshot,
  PlayerId,
  PlayerSetup,
  TickResult,
} from "@node-stream/shared";
import { createArrivalQueue } from "../arrivals/index.js";
import { createCommandQueue } from "../commands/index.js";
import { validateConfig } from "../config/index.js";
import { createFleetRegistry } from "../fleets/index.js";
import { createLinkRegistry } from "../links/index.js";
import { createPlanetRegistry } from "../planets/index.js";
import { createPlayerRoster } from "../players/index.js";
import { createShipRegistry } from "../ships/index.js";
import { computeHopTargets, generateWorld } from "../world/index.js";
import { claimStartingPlanetsForAi } from "./aiClaims.js";
import { MatchSetupError } from "./matchSetupError.js";
import type { MatchState } from "./matchState.js";
import { createSnapshot } from "./snapshot.js";
import { runTick } from "./tickPipeline.js";
import { createMatchView } from "./view.js";
import type { MatchView } from "./view.js";
export interface Match {
  submit(playerId: PlayerId, command: Command): void;
  step(): TickResult;
  snapshot(): MatchSnapshot;
  view(): MatchView;
}
function createInitialState(config: MatchConfig, players: readonly PlayerSetup[]): MatchState {
  const configErrors = validateConfig(config);
  if (configErrors.length > 0) {
    throw new MatchSetupError("invalidConfig", configErrors);
  }
  const world = generateWorld(config);
  if (world.planets.length === 0) {
    throw new MatchSetupError("emptyWorld");
  }
  return {
    config,
    planets: createPlanetRegistry(world),
    links: createLinkRegistry(computeHopTargets(world.planets, config.maxHopDistance)),
    players: createPlayerRoster(players),
    ships: createShipRegistry(),
    fleets: createFleetRegistry(),
    arrivals: createArrivalQueue(),
    commands: createCommandQueue(),
    tick: 0,
    status: "running",
  };
}
export function createMatch(config: MatchConfig, players: readonly PlayerSetup[]): Match {
  const state = createInitialState(config, players);
  claimStartingPlanetsForAi(state);
  state.planets.drainChanged();
  const view = createMatchView(state);
  return {
    submit: (playerId, command) => {
      if (state.players.get(playerId) !== undefined) {
        state.commands.push({ playerId, command });
      }
    },
    step: () => runTick(state),
    snapshot: () => createSnapshot(state),
    view: () => view,
  };
}
