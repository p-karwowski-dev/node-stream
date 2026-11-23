import type { PlayerId, ServerMessage } from "@node-stream/shared";

export interface LobbyOutbox {
  sendTo(playerId: PlayerId, message: ServerMessage): void;
  broadcast(message: ServerMessage): void;
}
