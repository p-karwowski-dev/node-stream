import type { CommandId } from "@node-stream/shared";
export interface CommandIdSource {
  next(): CommandId;
}
const firstClientCommandId = 1_000_000_000;
export function createCommandIdSource(): CommandIdSource {
  let nextId = firstClientCommandId;
  return {
    next: () => {
      const id = nextId;
      nextId += 1;
      return id;
    },
  };
}
