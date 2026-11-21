import type { Command, MatchEndedEvent, PlayerId, TickResult } from "@node-stream/shared";
import type { Match } from "../../core/match/index.js";
import { createCommandLog } from "./commandLog.js";
import type { CommandLogEntry } from "./commandLog.js";
export interface RunnerHooks {
  readonly beforeStep?: () => void;
  readonly onTick?: (result: TickResult) => void;
}
export interface FastRunResult {
  readonly lastTick: number;
  readonly ending: MatchEndedEvent;
}
export interface Runner {
  submit(playerId: PlayerId, command: Command): void;
  runFast(hooks?: RunnerHooks): FastRunResult;
  commandLog(): readonly CommandLogEntry[];
}
interface PendingCommand {
  readonly playerId: PlayerId;
  readonly command: Command;
}
function findMatchEnded(result: TickResult): MatchEndedEvent | undefined {
  return result.events.find((event): event is MatchEndedEvent => event.type === "matchEnded");
}
export function createRunner(match: Match): Runner {
  const log = createCommandLog();
  let pending: PendingCommand[] = [];
  const recordPending = (tick: number) => {
    for (const { playerId, command } of pending) {
      log.record({ tick, playerId, command });
    }
    pending = [];
  };
  return {
    submit: (playerId, command) => {
      pending.push({ playerId, command });
      match.submit(playerId, command);
    },
    runFast: (hooks = {}) => {
      for (;;) {
        hooks.beforeStep?.();
        const result = match.step();
        recordPending(result.tick);
        hooks.onTick?.(result);
        const ending = findMatchEnded(result);
        if (ending !== undefined) {
          return { lastTick: result.tick, ending };
        }
      }
    },
    commandLog: () => log.entries(),
  };
}
