import type {
  Command,
  MatchEndedEvent,
  PlayerId,
  TickResult,
} from "@node-stream/shared";
import type { Match } from "../../core/match/index.js";
import { createCommandLog } from "./commandLog.js";
import type { CommandLogEntry } from "./commandLog.js";
import { startRealTimeLoop } from "./realTimeLoop.js";
export interface RunnerHooks {
  readonly beforeStep?: () => void;
  readonly onTick?: (result: TickResult) => void;
}
export interface RealTimeHooks extends RunnerHooks {
  readonly onEnd: (lastTick: number, ending: MatchEndedEvent) => void;
}
export interface RealTimeOptions {
  readonly maxCatchUpTicksPerCycle?: number;
}
export interface RealTimeRun {
  stop(): void;
}
export interface FastRunResult {
  readonly lastTick: number;
  readonly ending: MatchEndedEvent;
}
export interface Runner {
  submit(playerId: PlayerId, command: Command): void;
  runFast(hooks?: RunnerHooks): FastRunResult;
  runRealTime(hooks: RealTimeHooks, options?: RealTimeOptions): RealTimeRun;
  commandLog(): readonly CommandLogEntry[];
}
interface PendingCommand {
  readonly playerId: PlayerId;
  readonly command: Command;
}
interface StepOutcome {
  readonly result: TickResult;
  readonly ending: MatchEndedEvent | undefined;
}
const defaultMaxCatchUpTicksPerCycle = 5;
function findMatchEnded(result: TickResult): MatchEndedEvent | undefined {
  return result.events.find(
    (event): event is MatchEndedEvent => event.type === "matchEnded"
  );
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
  const stepOnce = (hooks: RunnerHooks): StepOutcome => {
    hooks.beforeStep?.();
    const result = match.step();
    recordPending(result.tick);
    hooks.onTick?.(result);
    return { result, ending: findMatchEnded(result) };
  };
  return {
    submit: (playerId, command) => {
      pending.push({ playerId, command });
      match.submit(playerId, command);
    },
    runFast: (hooks = {}) => {
      for (;;) {
        const { result, ending } = stepOnce(hooks);
        if (ending !== undefined) {
          return { lastTick: result.tick, ending };
        }
      }
    },
    runRealTime: (hooks, options = {}) =>
      startRealTimeLoop({
        tickLengthMs: match.view().config.tickLengthMs,
        maxTicksPerCycle:
          options.maxCatchUpTicksPerCycle ?? defaultMaxCatchUpTicksPerCycle,
        runTick: () => {
          const { result, ending } = stepOnce(hooks);
          if (ending === undefined) {
            return false;
          }
          hooks.onEnd(result.tick, ending);
          return true;
        },
      }),
    commandLog: () => log.entries(),
  };
}
