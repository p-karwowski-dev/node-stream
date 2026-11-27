import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { MatchView } from "../state/index.js";
export interface SceneFrame {
  readonly match: MatchView;
  readonly myId: PlayerId;
  readonly selectedSourceId: PlanetId | null;
  readonly now: number;
}
