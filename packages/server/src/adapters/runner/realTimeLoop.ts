import { performance } from "node:perf_hooks";
import { scheduleAt } from "./monotonicTimer.js";
import type { ScheduledCall } from "./monotonicTimer.js";

export interface RealTimeLoopOptions {
  readonly tickLengthMs: number;
  readonly maxTicksPerCycle: number;
  readonly runTick: () => boolean;
}

export interface RealTimeLoop {
  stop(): void;
}

export function startRealTimeLoop(options: RealTimeLoopOptions): RealTimeLoop {
  const { tickLengthMs, maxTicksPerCycle, runTick } = options;
  const startedAt = performance.now();
  let ticksRun = 0;
  let stopped = false;
  let pending: ScheduledCall | undefined;
  const scheduleNextCycle = () => {
    pending = scheduleAt(startedAt + (ticksRun + 1) * tickLengthMs, cycle);
  };
  const cycle = () => {
    pending = undefined;
    const dueTicks = Math.floor((performance.now() - startedAt) / tickLengthMs);
    const count = Math.min(dueTicks - ticksRun, maxTicksPerCycle);
    for (let index = 0; index < count && !stopped; index += 1) {
      ticksRun += 1;
      if (runTick()) {
        stopped = true;
      }
    }
    if (!stopped) {
      scheduleNextCycle();
    }
  };
  scheduleNextCycle();
  return {
    stop: () => {
      stopped = true;
      pending?.cancel();
      pending = undefined;
    },
  };
}
