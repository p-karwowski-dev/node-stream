import type { ShipDepartedEvent } from "./events.js";
import type { PlanetId, PlayerId } from "./ids.js";
import type { PlayerKind } from "./players.js";
import type { Vector3 } from "./vector.js";
export type MatchStatus = "running" | "ended";
export interface PlanetSnapshot {
  readonly id: PlanetId;
  readonly position: Vector3;
  readonly points: number;
  readonly maxPoints: number;
  readonly ownerId: PlayerId | null;
  readonly shipsOnPlanet: number;
}
export interface LinkSnapshot {
  readonly from: PlanetId;
  readonly to: PlanetId;
}
export type ShipInFlightSnapshot = Omit<ShipDepartedEvent, "type">;
export interface PlayerSnapshot {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
  readonly claimed: boolean;
  readonly eliminated: boolean;
  readonly planets: number;
  readonly ships: number;
}
export interface MatchSnapshot {
  readonly tick: number;
  readonly status: MatchStatus;
  readonly planets: readonly PlanetSnapshot[];
  readonly links: readonly LinkSnapshot[];
  readonly ships: readonly ShipInFlightSnapshot[];
  readonly players: readonly PlayerSnapshot[];
}
