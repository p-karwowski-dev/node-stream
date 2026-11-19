import type { CommandId, PlanetId, PlayerId, ShipId } from "./ids.js";

export type CommandRejectionReason =
  | "planetTaken"
  | "alreadyClaimed"
  | "notOwner"
  | "outOfRange"
  | "linkExists"
  | "linkMissing"
  | "invalidPlanet";

export type MatchEndReason = "domination" | "timer" | "elimination";

export interface PlayerStanding {
  readonly playerId: PlayerId;
  readonly planets: number;
  readonly planetPoints: number;
  readonly maxPlanetPoints: number;
  readonly ships: number;
}

export interface ShipDepartedEvent {
  readonly type: "shipDeparted";
  readonly shipId: ShipId;
  readonly ownerId: PlayerId;
  readonly from: PlanetId;
  readonly to: PlanetId;
  readonly departureTime: number;
  readonly arrivalTime: number;
}

export interface PlanetChangedEvent {
  readonly type: "planetChanged";
  readonly planetId: PlanetId;
  readonly ownerId: PlayerId | null;
  readonly points: number;
}

export interface LinkCreatedEvent {
  readonly type: "linkCreated";
  readonly from: PlanetId;
  readonly to: PlanetId;
}

export interface LinkRemovedEvent {
  readonly type: "linkRemoved";
  readonly from: PlanetId;
  readonly to: PlanetId;
}

export interface CommandRejectedEvent {
  readonly type: "commandRejected";
  readonly commandId: CommandId;
  readonly reason: CommandRejectionReason;
}

export interface PlayerEliminatedEvent {
  readonly type: "playerEliminated";
  readonly playerId: PlayerId;
}

export interface MatchEndedEvent {
  readonly type: "matchEnded";
  readonly winnerId: PlayerId | null;
  readonly reason: MatchEndReason;
  readonly standings: readonly PlayerStanding[];
}

export type GameEvent =
  | ShipDepartedEvent
  | PlanetChangedEvent
  | LinkCreatedEvent
  | LinkRemovedEvent
  | CommandRejectedEvent
  | PlayerEliminatedEvent
  | MatchEndedEvent;

export interface TickResult {
  readonly tick: number;
  readonly events: readonly GameEvent[];
}
