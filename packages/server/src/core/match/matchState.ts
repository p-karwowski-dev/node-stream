import type { MatchConfig, MatchStatus } from "@node-stream/shared";
import type { ArrivalQueue } from "../arrivals/index.js";
import type { CommandQueue } from "../commands/index.js";
import type { FleetRegistry } from "../fleets/index.js";
import type { LinkRegistry } from "../links/index.js";
import type { PlanetRegistry } from "../planets/index.js";
import type { PlayerRoster } from "../players/index.js";
import type { ShipRegistry } from "../ships/index.js";
export interface MatchState {
  readonly config: MatchConfig;
  readonly planets: PlanetRegistry;
  readonly links: LinkRegistry;
  readonly players: PlayerRoster;
  readonly ships: ShipRegistry;
  readonly fleets: FleetRegistry;
  readonly arrivals: ArrivalQueue;
  readonly commands: CommandQueue;
  tick: number;
  status: MatchStatus;
}
