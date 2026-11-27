import type { ConfigError } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import type { Identity, LobbyView } from "../../state/index.js";
import { ConfigForm } from "./ConfigForm.js";
import { PlayerTable } from "./PlayerTable.js";
export interface LobbyScreenProps {
  readonly client: GameClient;
  readonly identity: Identity;
  readonly lobby: LobbyView;
  readonly configErrors: readonly ConfigError[];
}
export function LobbyScreen({ client, identity, lobby, configErrors }: LobbyScreenProps) {
  const isHost = lobby.hostId === identity.playerId;
  return (
    <div className="lobby">
      <section className="panel">
        <h2>Players</h2>
        <PlayerTable client={client} lobby={lobby} myId={identity.playerId} isHost={isHost} />
        {isHost ? (
          <p>
            <button type="button" onClick={() => client.addAi()}>
              Add AI
            </button>{" "}
            <button type="button" onClick={() => client.startMatch()}>
              Start match
            </button>
          </p>
        ) : (
          <p>Waiting for the host to start the match</p>
        )}
      </section>
      <section className="panel">
        <h2>Match parameters</h2>
        <ConfigForm client={client} config={lobby.config} configErrors={configErrors} editable={isHost} />
      </section>
    </div>
  );
}
