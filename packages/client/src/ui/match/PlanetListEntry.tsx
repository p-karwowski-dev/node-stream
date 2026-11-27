import { memo } from "react";
import type { PlanetId, PlanetSnapshot } from "@node-stream/shared";
import { relationColours } from "../../palette/relationColours.js";
import { planetName } from "../../state/index.js";
import type { PlanetRelation } from "../../state/index.js";
export interface PlanetListEntryProps {
  readonly planet: PlanetSnapshot;
  readonly relation: PlanetRelation;
  readonly selected: boolean;
  readonly onChoose: (planetId: PlanetId) => void;
}
function PlanetListEntryContent({ planet, relation, selected, onChoose }: PlanetListEntryProps) {
  return (
    <li className={selected ? "selected" : undefined}>
      <button type="button" data-planet-id={planet.id} onClick={() => onChoose(planet.id)}>
        <span className="planet-name" style={{ color: relationColours[relation] }}>
          {planetName(planet.id)}
        </span>{" "}
        <span className="planet-points">{planet.points}</span>
      </button>
    </li>
  );
}
export const PlanetListEntry = memo(PlanetListEntryContent);
