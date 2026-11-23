import { performance } from "node:perf_hooks";

export interface ScheduledCall {
  cancel(): void;
}

const maxTimerDelayMs = 2 ** 31 - 1;

export function scheduleAt(dueAt: number, callback: () => void): ScheduledCall {
  let timer: NodeJS.Timeout | undefined;
  const arm = () => {
    const remaining = Math.max(0, dueAt - performance.now());
    timer = setTimeout(fire, Math.min(remaining, maxTimerDelayMs));
  };
  const fire = () => {
    timer = undefined;
    if (performance.now() < dueAt) {
      arm();
      return;
    }
    callback();
  };
  arm();
  return {
    cancel: () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    },
  };
}
