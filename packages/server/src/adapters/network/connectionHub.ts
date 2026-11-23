import type { PlayerId, ServerMessage } from "@node-stream/shared";
import type { LobbyOutbox } from "../lobby/index.js";
import { replacedConnectionCloseCode } from "./messageLimits.js";

export interface ClientConnection {
  send(text: string): void;
  close(code: number, reason: string): void;
}

export interface ConnectionHub extends LobbyOutbox {
  bind(playerId: PlayerId, connection: ClientConnection): void;
  unbind(playerId: PlayerId, connection: ClientConnection): boolean;
}

const replacedConnectionReason = "replaced by a new connection";

export function createConnectionHub(): ConnectionHub {
  const connections = new Map<PlayerId, ClientConnection>();
  return {
    bind: (playerId, connection) => {
      const previous = connections.get(playerId);
      connections.set(playerId, connection);
      if (previous !== undefined && previous !== connection) {
        previous.close(replacedConnectionCloseCode, replacedConnectionReason);
      }
    },
    unbind: (playerId, connection) => {
      if (connections.get(playerId) !== connection) {
        return false;
      }
      connections.delete(playerId);
      return true;
    },
    sendTo: (playerId, message) => {
      connections.get(playerId)?.send(JSON.stringify(message));
    },
    broadcast: (message) => {
      const text = JSON.stringify(message);
      for (const connection of connections.values()) {
        connection.send(text);
      }
    },
  };
}
