import type { AddressInfo } from "node:net";
import { WebSocket, WebSocketServer } from "ws";
import type { Lobby } from "../lobby/index.js";
import { createClientSession } from "./clientSession.js";
import type { ClientConnection, ConnectionHub } from "./connectionHub.js";
import { maxPayloadBytes } from "./messageLimits.js";
import type { ReconnectTokens } from "./reconnectTokens.js";

export interface NetworkServerOptions {
  readonly host: string;
  readonly port: number;
  readonly hub: ConnectionHub;
  readonly lobby: Lobby;
  readonly tokens: ReconnectTokens;
}

export interface NetworkServer {
  readonly port: number;
  close(): Promise<void>;
}

function ignoreSocketError(): void {}

function wrapSocket(socket: WebSocket): ClientConnection {
  return {
    send: (text) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(text);
      }
    },
    close: (code, reason) => socket.close(code, reason),
  };
}

function listen(server: WebSocketServer): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
  });
}

export async function startNetworkServer(options: NetworkServerOptions): Promise<NetworkServer> {
  const { host, port, hub, lobby, tokens } = options;
  const server = new WebSocketServer({ host, port, maxPayload: maxPayloadBytes });
  await listen(server);
  server.on("connection", (socket) => {
    const session = createClientSession({ connection: wrapSocket(socket), hub, lobby, tokens });
    socket.on("message", (data, isBinary) => session.receive(data, isBinary));
    socket.on("close", () => session.closed());
    socket.on("error", ignoreSocketError);
  });
  return {
    port: (server.address() as AddressInfo).port,
    close: () =>
      new Promise((resolve) => {
        for (const client of server.clients) {
          client.terminate();
        }
        server.close(() => resolve());
      }),
  };
}
