import type { Command, PlayerId } from "@node-stream/shared";
import type { MatchView } from "../../core/match/index.js";
import type { Strategy } from "./strategy.js";
export interface AiPlayer {
  readonly playerId: PlayerId;
  readonly strategy: Strategy;
}
export interface AiController {
  decide(): void;
}
const firstCommandId = 1;
export function createAiController(
  view: MatchView,
  players: readonly AiPlayer[],
  submit: (playerId: PlayerId, command: Command) => void,
): AiController {
  const nextCommandIds = new Map<PlayerId, number>(players.map((player) => [player.playerId, firstCommandId]));
  const takeCommandId = (playerId: PlayerId): number => {
    const commandId = nextCommandIds.get(playerId) ?? firstCommandId;
    nextCommandIds.set(playerId, commandId + 1);
    return commandId;
  };
  return {
    decide: () => {
      const tick = view.tick();
      for (const { playerId, strategy } of players) {
        if (tick % strategy.decisionIntervalTicks !== 0 || view.player(playerId)?.eliminated) {
          continue;
        }
        for (const intent of strategy.decide(view, playerId)) {
          submit(playerId, { ...intent, commandId: takeCommandId(playerId) });
        }
      }
    },
  };
}
