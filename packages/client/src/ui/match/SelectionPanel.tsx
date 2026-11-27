import { useMemo } from "react";
import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import { findPlanet, outgoingLinks, planetName, planetsInRange } from "../../state/index.js";
import type { MatchView } from "../../state/index.js";
export interface SelectionPanelProps {
  readonly client: GameClient;
  readonly match: MatchView;
  readonly myId: PlayerId;
  readonly selectedSourceId: PlanetId | null;
}
const claimHintText = "Click a rogue planet to claim it";
const sourceHintText = "Pick one of your planets as the link source";
function SourceDetails({ client, match, sourceId }: { client: GameClient; match: MatchView; sourceId: PlanetId }) {
  const { planets, links } = match;
  const inRange = useMemo(() => planetsInRange(match, sourceId), [planets, links, sourceId]);
  const linksFromSource = useMemo(() => outgoingLinks(match, sourceId), [links, sourceId]);
  return (
    <>
      <p>
        Source: {planetName(sourceId)}{" "}
        <button type="button" onClick={() => client.clearSource()}>
          Clear
        </button>
      </p>
      <h3>Links</h3>
      <ul className="links">
        {linksFromSource.map((link) => (
          <li key={link.to}>
            {planetName(link.from)} → {planetName(link.to)}{" "}
            <button type="button" onClick={() => client.removeLink(link.from, link.to)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <h3>In range</h3>
      <ul className="in-range">
        {inRange.map((planet) => (
          <li key={planet.id}>
            <button type="button" data-planet-id={planet.id} onClick={() => client.createLink(sourceId, planet.id)}>
              {planetName(planet.id)}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
export function SelectionPanel({ client, match, myId, selectedSourceId }: SelectionPanelProps) {
  const source = selectedSourceId === null ? undefined : findPlanet(match, selectedSourceId);
  const ownedSource = source?.ownerId === myId ? source : undefined;
  return (
    <div className="selection panel">
      {!match.hasClaimed ? <p>{claimHintText}</p> : null}
      {match.hasClaimed && ownedSource !== undefined ? (
        <SourceDetails client={client} match={match} sourceId={ownedSource.id} />
      ) : null}
      {match.hasClaimed && ownedSource === undefined ? <p>{sourceHintText}</p> : null}
    </div>
  );
}
