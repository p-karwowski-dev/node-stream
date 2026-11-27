import type { MatchEndedEvent, PlayerSnapshot } from "@node-stream/shared";
import type { GameClient } from "../session/index.js";
import { winnerLine } from "../state/index.js";
export interface EndScreenProps {
  readonly client: GameClient;
  readonly result: MatchEndedEvent;
  readonly players: readonly PlayerSnapshot[];
}
export function EndScreen({ client, result, players }: EndScreenProps) {
  return (
    <div className="panel end">
      <h2>Match over</h2>
      <p className="winner">{winnerLine(result, players)}</p>
      <button type="button" onClick={() => client.returnToLobby()}>
        Play again
      </button>
    </div>
  );
}
