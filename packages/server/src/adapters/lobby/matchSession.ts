import { performance } from "node:perf_hooks";
import type {
  Command,
  MatchConfig,
  MatchEndedEvent,
  MatchStartedMessage,
  PlayerId,
  PlayerSetup,
  SnapshotMessage,
} from "@node-stream/shared";
import { createMatch } from "../../core/match/index.js";
import { createAiController } from "../ai/index.js";
import type { AiPlayer } from "../ai/index.js";
import { createRunner, scheduleAt } from "../runner/index.js";
import type { RealTimeRun, ScheduledCall } from "../runner/index.js";
import type { LobbyOutbox } from "./lobbyOutbox.js";

export interface MatchSessionOptions {
  readonly config: MatchConfig;
  readonly players: readonly PlayerSetup[];
  readonly aiPlayers: readonly AiPlayer[];
  readonly outbox: LobbyOutbox;
  readonly onEnded: (lastTick: number, ending: MatchEndedEvent, commandLogEntries: number) => void;
}

export interface MatchSession {
  readonly planetCount: number;
  submit(playerId: PlayerId, command: Command): void;
  sendState(playerId: PlayerId): void;
  stop(): void;
}

const millisecondsPerSecond = 1000;

export function createMatchSession(options: MatchSessionOptions): MatchSession {
  const { config, outbox, onEnded } = options;
  const match = createMatch(config, options.players);
  const runner = createRunner(match);
  const ai = createAiController(match.view(), options.aiPlayers, runner.submit);
  const countdownEndsAt = performance.now() + config.startCountdownSeconds * millisecondsPerSecond;
  let countdown: ScheduledCall | undefined;
  let run: RealTimeRun | undefined;
  let result: MatchEndedEvent | null = null;
  const matchStartedMessage = (countdownSeconds: number): MatchStartedMessage => {
    const { players, planets, links } = match.snapshot();
    return { type: "matchStarted", countdownSeconds, config, players, planets, links };
  };
  const snapshotMessage = (): SnapshotMessage => ({ type: "snapshot", config, ...match.snapshot(), result });
  const startTicks = () => {
    countdown = undefined;
    run = runner.runRealTime({
      beforeStep: ai.decide,
      onTick: (tickResult) => outbox.broadcast({ type: "tick", tick: tickResult.tick, events: tickResult.events }),
      onEnd: (lastTick, ending) => {
        result = ending;
        onEnded(lastTick, ending, runner.commandLog().length);
      },
    });
  };
  outbox.broadcast(matchStartedMessage(config.startCountdownSeconds));
  countdown = scheduleAt(countdownEndsAt, startTicks);
  return {
    planetCount: match.snapshot().planets.length,
    submit: runner.submit,
    sendState: (playerId) => {
      if (countdown === undefined) {
        outbox.sendTo(playerId, snapshotMessage());
        return;
      }
      const remainingSeconds = Math.max(0, countdownEndsAt - performance.now()) / millisecondsPerSecond;
      outbox.sendTo(playerId, matchStartedMessage(remainingSeconds));
    },
    stop: () => {
      countdown?.cancel();
      countdown = undefined;
      run?.stop();
      run = undefined;
    },
  };
}
