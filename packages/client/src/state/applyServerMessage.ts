import type { CommandId, ErrorMessage, ServerMessage, TickMessage } from "@node-stream/shared";
import { applyTick } from "./applyTickEvents.js";
import { fromMatchStarted, fromSnapshot } from "./buildMatchView.js";
import { withNotice } from "./clientState.js";
import type { ClientState } from "./clientState.js";
import { rejectionText } from "./noticeText.js";
import { findPlanet } from "./planetFacts.js";
function errorText(message: ErrorMessage): string {
  const details = message.configErrors.map((error) => `${error.parameter}: ${error.message}`);
  return [message.message, ...details].join("; ");
}
function applyTickMessage(state: ClientState, message: TickMessage, receivedAt: number): ClientState {
  if (state.match === null || state.identity === null) {
    return state;
  }
  const myId = state.identity.playerId;
  const outcome = applyTick(state.match, message, receivedAt, myId);
  const ownRejections = outcome.rejected.filter((event) => state.sentCommandIds.has(event.commandId));
  let sentCommandIds = state.sentCommandIds;
  if (ownRejections.length > 0) {
    const remaining = new Set<CommandId>(sentCommandIds);
    ownRejections.forEach((event) => remaining.delete(event.commandId));
    sentCommandIds = remaining;
  }
  const source = state.selectedSourceId === null ? undefined : findPlanet(outcome.match, state.selectedSourceId);
  const selectedSourceId = source?.ownerId === myId ? state.selectedSourceId : null;
  const next: ClientState = { ...state, match: outcome.match, sentCommandIds, selectedSourceId };
  return ownRejections.reduce((current, event) => withNotice(current, rejectionText(event.reason)), next);
}
export function applyServerMessage(state: ClientState, message: ServerMessage, receivedAt: number): ClientState {
  switch (message.type) {
    case "joined":
      return { ...state, identity: { playerId: message.playerId, isHost: message.isHost } };
    case "lobbyState":
      return {
        ...state,
        lobby: { players: message.players, config: message.config, hostId: message.hostId },
        match: null,
        selectedSourceId: null,
        configErrors: [],
        sentCommandIds: new Set(),
      };
    case "matchStarted":
    case "snapshot": {
      if (state.identity === null) {
        return state;
      }
      return {
        ...state,
        match:
          message.type === "matchStarted"
            ? fromMatchStarted(message, receivedAt, state.identity.playerId, state.nextWorldKey)
            : fromSnapshot(message, receivedAt, state.identity.playerId, state.nextWorldKey),
        nextWorldKey: state.nextWorldKey + 1,
        selectedSourceId: null,
      };
    }
    case "tick":
      return applyTickMessage(state, message, receivedAt);
    case "error":
      return withNotice({ ...state, configErrors: message.configErrors }, errorText(message));
  }
}
