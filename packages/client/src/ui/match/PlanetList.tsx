import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import { planetRelation } from "../../state/index.js";
import type { MatchView } from "../../state/index.js";
import { PlanetListEntry } from "./PlanetListEntry.js";
export interface PlanetListProps {
  readonly client: GameClient;
  readonly match: MatchView;
  readonly myId: PlayerId;
  readonly selectedSourceId: PlanetId | null;
}
export function PlanetList({ client, match, myId, selectedSourceId }: PlanetListProps) {
  return (
    <>
      <h2>Planets</h2>
      <ul>
        {match.planets.map((planet) => (
          <PlanetListEntry
            key={planet.id}
            planet={planet}
            relation={planetRelation(planet.ownerId, myId)}
            selected={planet.id === selectedSourceId}
            onChoose={client.choosePlanet}
          />
        ))}
      </ul>
    </>
  );
}
