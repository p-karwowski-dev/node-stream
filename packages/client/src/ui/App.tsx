import type { GameClient } from "../session/index.js";
import { currentScreen } from "../state/index.js";
import type { ClientState, ClientStore } from "../state/index.js";
import { ConnectionBanner } from "./ConnectionBanner.js";
import { EndScreen } from "./EndScreen.js";
import { JoinScreen } from "./JoinScreen.js";
import { LobbyScreen } from "./lobby/LobbyScreen.js";
import { MatchScreen } from "./match/MatchScreen.js";
import { MessageBar } from "./MessageBar.js";
import { useClientState } from "./useClientState.js";
export interface AppProps {
  readonly client: GameClient;
  readonly store: ClientStore;
}
function ScreenContent({ client, store, state }: AppProps & { readonly state: ClientState }) {
  const { identity, lobby, match } = state;
  switch (currentScreen(state)) {
    case "connecting":
      return <p className="status">Connecting...</p>;
    case "join":
      return <JoinScreen client={client} canJoin={state.connection === "open"} />;
    case "lobby":
      return identity !== null && lobby !== null ? (
        <LobbyScreen client={client} identity={identity} lobby={lobby} configErrors={state.configErrors} />
      ) : null;
    case "match":
      return identity !== null && match !== null ? (
        <MatchScreen
          client={client}
          store={store}
          match={match}
          myId={identity.playerId}
          selectedSourceId={state.selectedSourceId}
        />
      ) : null;
    case "ended":
      return match?.result != null ? <EndScreen client={client} result={match.result} players={match.players} /> : null;
  }
}
export function App({ client, store }: AppProps) {
  const state = useClientState(store);
  return (
    <div className="app">
      <MessageBar notice={state.notice} />
      {state.connection === "closed" ? <ConnectionBanner client={client} /> : null}
      <ScreenContent client={client} store={store} state={state} />
    </div>
  );
}
