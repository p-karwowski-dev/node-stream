import type { Scene } from "three";
import type { LinkSnapshot, PlanetId, PlanetSnapshot, PlayerId } from "@node-stream/shared";
import { displayMatchTime } from "../state/index.js";
import { createLinkLines } from "./linkLines.js";
import { createPlanetInstances } from "./planetInstances.js";
import type { PlanetInstances } from "./planetInstances.js";
import { createPlanetLabels } from "./planetLabels.js";
import type { SceneFrame } from "./sceneFrame.js";
import { createShipPoints } from "./shipPoints.js";
export interface SceneWorld {
  readonly worldKey: number;
  readonly planets: PlanetInstances;
  draw(frame: SceneFrame): void;
  dispose(): void;
}
export function createSceneWorld(scene: Scene, frame: SceneFrame): SceneWorld {
  const { match, myId } = frame;
  const planets = createPlanetInstances(match, myId, frame.selectedSourceId);
  const labels = createPlanetLabels(match.planets, planets.radius);
  const links = createLinkLines();
  const ships = createShipPoints(match.config.minPlanetDistance);
  links.update(match, myId);
  scene.add(planets.mesh, labels.group, links.lines, ships.points);
  let shownPlanets: readonly PlanetSnapshot[] = match.planets;
  let shownLinks: readonly LinkSnapshot[] = match.links;
  let shownSelection: PlanetId | null = frame.selectedSourceId;
  const shownPlayer: PlayerId = myId;
  return {
    worldKey: match.worldKey,
    planets,
    draw: (current) => {
      const view = current.match;
      if (view.planets !== shownPlanets || current.selectedSourceId !== shownSelection) {
        planets.update(view.planets, current.selectedSourceId);
        labels.update(view.planets);
        shownPlanets = view.planets;
        shownSelection = current.selectedSourceId;
      }
      if (view.links !== shownLinks) {
        links.update(view, shownPlayer);
        shownLinks = view.links;
      }
      ships.update(view, shownPlayer, displayMatchTime(view, current.now));
    },
    dispose: () => {
      scene.remove(planets.mesh, labels.group, links.lines, ships.points);
      labels.dispose();
      planets.dispose();
      links.dispose();
      ships.dispose();
    },
  };
}
