import type { ClientMessage, ErrorCode, PlayerId, ServerMessage } from "@node-stream/shared";
import type { RawData } from "ws";
import { errorMessage } from "../lobby/index.js";
import type { Lobby } from "../lobby/index.js";
import type { ClientConnection, ConnectionHub } from "./connectionHub.js";
import { maxInvalidMessages, maxMessageBytes, policyViolationCloseCode } from "./messageLimits.js";
import { parseClientMessage } from "./parseClientMessage.js";
import type { ReconnectTokens } from "./reconnectTokens.js";

export interface ClientSessionOptions {
  readonly connection: ClientConnection;
  readonly hub: ConnectionHub;
  readonly lobby: Lobby;
  readonly tokens: ReconnectTokens;
}

export interface ClientSession {
  receive(data: RawData, isBinary: boolean): void;
  closed(): void;
}

const tooManyInvalidMessagesReason = "too many invalid messages";

function toBuffer(data: RawData): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  return Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data);
}

export function createClientSession(options: ClientSessionOptions): ClientSession {
  const { connection, hub, lobby, tokens } = options;
  let playerId: PlayerId | null = null;
  let invalidCount = 0;
  let closedByPolicy = false;
  const send = (message: ServerMessage) => connection.send(JSON.stringify(message));
  const sendError = (code: ErrorCode, text: string) => send(errorMessage(code, text));
  const rejectInvalid = (code: ErrorCode, text: string) => {
    sendError(code, text);
    invalidCount += 1;
    if (invalidCount >= maxInvalidMessages) {
      closedByPolicy = true;
      connection.close(policyViolationCloseCode, tooManyInvalidMessagesReason);
    }
  };
  const enter = (id: PlayerId, token: string) => {
    playerId = id;
    hub.bind(id, connection);
    send({ type: "joined", playerId: id, token, isHost: lobby.isHost(id) });
    lobby.playerConnected(id);
  };
  const route = (message: ClientMessage) => {
    if (message.type === "join" || message.type === "reconnect") {
      if (playerId !== null) {
        sendError("alreadyJoined", "This connection has already joined");
        return;
      }
      if (message.type === "join") {
        const outcome = lobby.join(message.name);
        if (!outcome.ok) {
          send(outcome.error);
          return;
        }
        enter(outcome.playerId, tokens.issue(outcome.playerId));
        return;
      }
      const returningId = tokens.resolve(message.token);
      if (returningId === undefined) {
        sendError("unknownToken", "This reconnect token is not known");
        return;
      }
      enter(returningId, message.token);
      return;
    }
    if (playerId === null) {
      sendError("notJoined", "Send join or reconnect first");
      return;
    }
    lobby.handle(playerId, message);
  };
  return {
    receive: (data, isBinary) => {
      if (closedByPolicy) {
        return;
      }
      if (isBinary) {
        rejectInvalid("invalidMessage", "Binary messages are not accepted");
        return;
      }
      const buffer = toBuffer(data);
      if (buffer.byteLength > maxMessageBytes) {
        rejectInvalid("messageTooLarge", `Messages are limited to ${maxMessageBytes} bytes`);
        return;
      }
      const parsed = parseClientMessage(buffer.toString("utf8"));
      if (!parsed.ok) {
        rejectInvalid("invalidMessage", `Invalid message: ${parsed.reason}`);
        return;
      }
      route(parsed.message);
    },
    closed: () => {
      if (playerId !== null && hub.unbind(playerId, connection)) {
        lobby.playerDisconnected(playerId);
      }
    },
  };
}
