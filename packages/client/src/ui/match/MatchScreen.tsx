import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import type { ClientStore, MatchView } from "../../state/index.js";
import { CountdownOverlay } from "./CountdownOverlay.js";
import { PlanetList } from "./PlanetList.js";
import { SelectionPanel } from "./SelectionPanel.js";
import { SpaceView } from "./SpaceView.js";
export interface MatchScreenProps {
  readonly client: GameClient;
  readonly store: ClientStore;
  readonly match: MatchView;
  readonly myId: PlayerId;
  readonly selectedSourceId: PlanetId | null;
}
export function MatchScreen({ client, store, match, myId, selectedSourceId }: MatchScreenProps) {
  return (
    <div className="match">
      <aside className="planet-list panel">
        <PlanetList client={client} match={match} myId={myId} selectedSourceId={selectedSourceId} />
      </aside>
      <main className="space">
        <SpaceView client={client} store={store} />
        <SelectionPanel client={client} match={match} myId={myId} selectedSourceId={selectedSourceId} />
        <CountdownOverlay match={match} />
      </main>
    </div>
  );
}
