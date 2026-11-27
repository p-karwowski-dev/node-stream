import { Group } from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { PlanetSnapshot } from "@node-stream/shared";
export interface PlanetLabels {
  readonly group: Group;
  update(planets: readonly PlanetSnapshot[]): void;
  dispose(): void;
}
const labelClassName = "planet-label";
export function createPlanetLabels(planets: readonly PlanetSnapshot[], planetRadius: number): PlanetLabels {
  const group = new Group();
  const elements = planets.map((planet) => {
    const element = document.createElement("div");
    element.className = labelClassName;
    const label = new CSS2DObject(element);
    label.position.set(planet.position.x, planet.position.y + planetRadius * 2, planet.position.z);
    group.add(label);
    return element;
  });
  let shownPlanets: readonly (PlanetSnapshot | undefined)[] = [];
  const update = (current: readonly PlanetSnapshot[]) => {
    current.forEach((planet, index) => {
      const element = elements[index];
      if (element !== undefined && planet !== shownPlanets[index]) {
        element.textContent = String(planet.points);
      }
    });
    shownPlanets = current;
  };
  update(planets);
  return {
    group,
    update,
    dispose: () => group.clear(),
  };
}
