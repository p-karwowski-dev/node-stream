import type { PlayerId } from "./ids.js";
export type PlayerKind = "human" | "ai";
export interface PlayerSetup {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
}
