import type { Command, PlayerId } from "@node-stream/shared";
export interface QueuedCommand {
  readonly playerId: PlayerId;
  readonly command: Command;
}
export interface CommandQueue {
  push(entry: QueuedCommand): void;
  drain(): QueuedCommand[];
}
export function createCommandQueue(): CommandQueue {
  let pending: QueuedCommand[] = [];
  function drain(): QueuedCommand[] {
    const drained = pending;
    pending = [];
    return drained;
  }
  return {
    push: (entry) => {
      pending.push(entry);
    },
    drain,
  };
}
