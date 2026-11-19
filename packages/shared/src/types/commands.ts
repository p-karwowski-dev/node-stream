import type { CommandId, PlanetId } from "./ids.js";

export interface ClaimPlanetCommand {
  readonly type: "claimPlanet";
  readonly commandId: CommandId;
  readonly planetId: PlanetId;
}

export interface CreateLinkCommand {
  readonly type: "createLink";
  readonly commandId: CommandId;
  readonly from: PlanetId;
  readonly to: PlanetId;
}

export interface RemoveLinkCommand {
  readonly type: "removeLink";
  readonly commandId: CommandId;
  readonly from: PlanetId;
  readonly to: PlanetId;
}

export type Command = ClaimPlanetCommand | CreateLinkCommand | RemoveLinkCommand;
