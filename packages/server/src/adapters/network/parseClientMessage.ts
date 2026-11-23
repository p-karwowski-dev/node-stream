import type { ClientMessage } from "@node-stream/shared";
import { parseConfigChanges } from "./configChangesShape.js";
import { maxPlayerNameLength, maxStrategyNameLength, maxTokenLength } from "./messageLimits.js";
import { hasOnlyKeys, isBoundedString, isIdentifier, isPlainObject } from "./messageShape.js";

export type ParseResult =
  | { readonly ok: true; readonly message: ClientMessage }
  | { readonly ok: false; readonly reason: string };

type FieldParser = (record: Record<string, unknown>) => ClientMessage | undefined;

function withKeys(keys: readonly string[], parse: FieldParser): FieldParser {
  const allowed = ["type", ...keys];
  return (record) => (hasOnlyKeys(record, allowed) ? parse(record) : undefined);
}

function parseJoin(record: Record<string, unknown>): ClientMessage | undefined {
  if (typeof record.name !== "string") {
    return undefined;
  }
  const name = record.name.trim();
  return isBoundedString(name, maxPlayerNameLength) ? { type: "join", name } : undefined;
}

function parseLinkCommand(type: "createLink" | "removeLink"): FieldParser {
  return ({ commandId, from, to }) =>
    isIdentifier(commandId) && isIdentifier(from) && isIdentifier(to) ? { type, commandId, from, to } : undefined;
}

const parsers: ReadonlyMap<string, FieldParser> = new Map<string, FieldParser>([
  ["join", withKeys(["name"], parseJoin)],
  [
    "reconnect",
    withKeys(["token"], ({ token }) => (isBoundedString(token, maxTokenLength) ? { type: "reconnect", token } : undefined)),
  ],
  [
    "setConfig",
    withKeys(["changes"], ({ changes }) => {
      const parsed = parseConfigChanges(changes);
      return parsed === undefined ? undefined : { type: "setConfig", changes: parsed };
    }),
  ],
  [
    "addAi",
    withKeys(["strategy"], ({ strategy }) =>
      isBoundedString(strategy, maxStrategyNameLength) ? { type: "addAi", strategy } : undefined,
    ),
  ],
  ["removeAi", withKeys(["playerId"], ({ playerId }) => (isIdentifier(playerId) ? { type: "removeAi", playerId } : undefined))],
  ["startMatch", withKeys([], () => ({ type: "startMatch" }))],
  [
    "claimPlanet",
    withKeys(["commandId", "planetId"], ({ commandId, planetId }) =>
      isIdentifier(commandId) && isIdentifier(planetId) ? { type: "claimPlanet", commandId, planetId } : undefined,
    ),
  ],
  ["createLink", withKeys(["commandId", "from", "to"], parseLinkCommand("createLink"))],
  ["removeLink", withKeys(["commandId", "from", "to"], parseLinkCommand("removeLink"))],
]);

function parseJson(text: string): { readonly ok: true; readonly value: unknown } | { readonly ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function parseClientMessage(text: string): ParseResult {
  const json = parseJson(text);
  if (!json.ok) {
    return { ok: false, reason: "not valid JSON" };
  }
  if (!isPlainObject(json.value) || typeof json.value.type !== "string") {
    return { ok: false, reason: "a message must be a JSON object with a string type" };
  }
  const type = json.value.type;
  const parser = parsers.get(type);
  if (parser === undefined) {
    return { ok: false, reason: "unknown message type" };
  }
  const message = parser(json.value);
  return message === undefined ? { ok: false, reason: `invalid fields for ${type}` } : { ok: true, message };
}
