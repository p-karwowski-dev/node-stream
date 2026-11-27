import type { ClientMessage, ServerMessage } from "@node-stream/shared";
export interface GameConnectionHandlers {
  onOpen(): void;
  onMessage(message: ServerMessage): void;
  onClose(): void;
}
export interface GameConnection {
  send(message: ClientMessage): void;
  close(): void;
}
function isServerMessage(value: unknown): value is ServerMessage {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}
function parseServerMessage(data: unknown): ServerMessage | undefined {
  if (typeof data !== "string") {
    return undefined;
  }
  try {
    const value: unknown = JSON.parse(data);
    return isServerMessage(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
export function createGameConnection(url: string, handlers: GameConnectionHandlers): GameConnection {
  const socket = new WebSocket(url);
  socket.addEventListener("open", () => handlers.onOpen());
  socket.addEventListener("close", () => handlers.onClose());
  socket.addEventListener("message", (event: MessageEvent<unknown>) => {
    const message = parseServerMessage(event.data);
    if (message !== undefined) {
      handlers.onMessage(message);
    }
  });
  return {
    send: (message) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    },
    close: () => socket.close(),
  };
}
