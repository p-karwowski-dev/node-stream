import type { ClaimPlanetCommand, CreateLinkCommand, PlayerId, RemoveLinkCommand } from "@node-stream/shared";
import type { MatchView } from "../../core/match/index.js";
export type CommandIntent =
  | Omit<ClaimPlanetCommand, "commandId">
  | Omit<CreateLinkCommand, "commandId">
  | Omit<RemoveLinkCommand, "commandId">;
export interface Strategy {
  readonly name: string;
  readonly decisionIntervalTicks: number;
  decide(view: MatchView, playerId: PlayerId): CommandIntent[];
}
