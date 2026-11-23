import type { Strategy } from "./strategy.js";
import { weakestInRange } from "./weakestInRange.js";

const strategies: ReadonlyMap<string, Strategy> = new Map([[weakestInRange.name, weakestInRange]]);

export function findStrategy(name: string): Strategy | undefined {
  return strategies.get(name);
}
