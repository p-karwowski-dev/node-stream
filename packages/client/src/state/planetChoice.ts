import type { PlanetId, PlayerId } from "@node-stream/shared";
import type { MatchView } from "./clientState.js";
import { findPlanet, isInHopRange, isRogue, planetName } from "./planetFacts.js";
export type PlanetChoice =
  | { readonly kind: "claim"; readonly planetId: PlanetId }
  | { readonly kind: "selectSource"; readonly planetId: PlanetId }
  | { readonly kind: "clearSource" }
  | { readonly kind: "createLink"; readonly from: PlanetId; readonly to: PlanetId }
  | { readonly kind: "notice"; readonly text: string };
const onlyRogueText = "Only a rogue planet can be claimed";
const pickSourceText = "Pick one of your planets as the link source";
export function choosePlanet(
  match: MatchView,
  myId: PlayerId,
  selectedSourceId: PlanetId | null,
  planetId: PlanetId,
): PlanetChoice | null {
  const planet = findPlanet(match, planetId);
  if (planet === undefined) {
    return null;
  }
  if (!match.hasClaimed) {
    return isRogue(planet) ? { kind: "claim", planetId } : { kind: "notice", text: onlyRogueText };
  }
  if (planetId === selectedSourceId) {
    return { kind: "clearSource" };
  }
  const isOwn = planet.ownerId === myId;
  const source = selectedSourceId === null ? undefined : findPlanet(match, selectedSourceId);
  if (source !== undefined) {
    if (isInHopRange(match, source, planet)) {
      return { kind: "createLink", from: source.id, to: planetId };
    }
    if (isOwn) {
      return { kind: "selectSource", planetId };
    }
    return { kind: "notice", text: `${planetName(planetId)} is out of range of ${planetName(source.id)}` };
  }
  return isOwn ? { kind: "selectSource", planetId } : { kind: "notice", text: pickSourceText };
}
