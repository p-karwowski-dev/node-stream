import type { PlayerId } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import type { LobbyView } from "../../state/index.js";
export interface PlayerTableProps {
  readonly client: GameClient;
  readonly lobby: LobbyView;
  readonly myId: PlayerId;
  readonly isHost: boolean;
}
export function PlayerTable({ client, lobby, myId, isHost }: PlayerTableProps) {
  return (
    <table className="players">
      <thead>
        <tr>
          <th>Name</th>
          <th>Kind</th>
          <th>Strategy</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lobby.players.map((player) => (
          <tr key={player.id} data-player-id={player.id}>
            <td>
              {player.name}
              {player.id === myId ? " (you)" : ""}
              {player.id === lobby.hostId ? " (host)" : ""}
            </td>
            <td>{player.kind}</td>
            <td>{player.strategy ?? ""}</td>
            <td>{player.connected ? "connected" : "disconnected"}</td>
            <td>
              {isHost && player.kind === "ai" ? (
                <button type="button" onClick={() => client.removeAi(player.id)}>
                  Remove
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
