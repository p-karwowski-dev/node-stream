import { performance } from "node:perf_hooks";
import type { MatchConfig, MatchEndedEvent, PlayerSetup, TickResult } from "@node-stream/shared";
import { createAiController, weakestInRange } from "../adapters/ai/index.js";
import { createRunner } from "../adapters/runner/index.js";
import { createMatch } from "../core/match/index.js";
import type { MatchView } from "../core/match/index.js";
export interface TickObserver {
  beforeStep(): void;
  afterTick(result: TickResult, view: MatchView): void;
}
export interface HeadlessMatchOptions {
  readonly config: MatchConfig;
  readonly aiPlayerCount: number;
  readonly observer?: TickObserver;
}
export interface HeadlessMatchReport {
  readonly players: readonly PlayerSetup[];
  readonly planetCount: number;
  readonly lastTick: number;
  readonly ending: MatchEndedEvent;
  readonly setupMilliseconds: number;
  readonly runMilliseconds: number;
  readonly commandLogEntries: number;
}
const firstAiPlayerId = 1;
export function createAiPlayerSetups(count: number): PlayerSetup[] {
  return Array.from({ length: count }, (_, index) => {
    const id = firstAiPlayerId + index;
    return { id, name: `AI ${id}`, kind: "ai" };
  });
}
export function runHeadlessMatch(options: HeadlessMatchOptions): HeadlessMatchReport {
  const { config, aiPlayerCount, observer } = options;
  const players = createAiPlayerSetups(aiPlayerCount);
  const setupStart = performance.now();
  const match = createMatch(config, players);
  const setupMilliseconds = performance.now() - setupStart;
  const runner = createRunner(match);
  const view = match.view();
  const ai = createAiController(
    view,
    players.map((player) => ({ playerId: player.id, strategy: weakestInRange })),
    runner.submit,
  );
  const runStart = performance.now();
  const { lastTick, ending } = runner.runFast({
    beforeStep: () => {
      ai.decide();
      observer?.beforeStep();
    },
    onTick: (result) => observer?.afterTick(result, view),
  });
  const runMilliseconds = performance.now() - runStart;
  return {
    players,
    planetCount: view.planets().length,
    lastTick,
    ending,
    setupMilliseconds,
    runMilliseconds,
    commandLogEntries: runner.commandLog().length,
  };
}
