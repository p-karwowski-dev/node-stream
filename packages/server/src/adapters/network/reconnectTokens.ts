import { randomUUID } from "node:crypto";
import type { PlayerId } from "@node-stream/shared";

export interface ReconnectTokens {
  issue(playerId: PlayerId): string;
  resolve(token: string): PlayerId | undefined;
}

export function createReconnectTokens(): ReconnectTokens {
  const players = new Map<string, PlayerId>();
  return {
    issue: (playerId) => {
      const token = randomUUID();
      players.set(token, playerId);
      return token;
    },
    resolve: (token) => players.get(token),
  };
}
