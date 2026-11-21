import type { Command, PlayerId } from "@node-stream/shared";
export interface CommandLogEntry {
  readonly tick: number;
  readonly playerId: PlayerId;
  readonly command: Command;
}
export interface CommandLog {
  record(entry: CommandLogEntry): void;
  entries(): readonly CommandLogEntry[];
}
export function createCommandLog(): CommandLog {
  const recorded: CommandLogEntry[] = [];
  return {
    record: (entry) => {
      recorded.push(entry);
    },
    entries: () => recorded,
  };
}
