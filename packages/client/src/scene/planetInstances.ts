import { Color, InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";
import type { PlanetId, PlanetSnapshot, PlayerId } from "@node-stream/shared";
import { relationColours } from "../palette/relationColours.js";
import { planetRelation } from "../state/index.js";
import type { MatchView } from "../state/index.js";
export interface PlanetInstances {
  readonly mesh: InstancedMesh;
  readonly radius: number;
  update(planets: readonly PlanetSnapshot[], selectedSourceId: PlanetId | null): void;
  planetIdAt(instanceId: number): PlanetId | undefined;
  dispose(): void;
}
const planetRadiusRatio = 0.1;
const selectedScale = 1.6;
const sphereWidthSegments = 16;
const sphereHeightSegments = 12;
export function createPlanetInstances(match: MatchView, myId: PlayerId, selectedSourceId: PlanetId | null): PlanetInstances {
  const radius = match.config.minPlanetDistance * planetRadiusRatio;
  const geometry = new SphereGeometry(radius, sphereWidthSegments, sphereHeightSegments);
  const material = new MeshBasicMaterial();
  const mesh = new InstancedMesh(geometry, material, Math.max(match.planets.length, 1));
  mesh.count = match.planets.length;
  const placement = new Object3D();
  const colour = new Color();
  const planetIds = match.planets.map((planet) => planet.id);
  let shownPlanets: readonly (PlanetSnapshot | undefined)[] = [];
  let shownSelection: PlanetId | null = null;
  const writeInstance = (index: number, planet: PlanetSnapshot, selected: boolean) => {
    placement.position.set(planet.position.x, planet.position.y, planet.position.z);
    placement.scale.setScalar(selected ? selectedScale : 1);
    placement.updateMatrix();
    mesh.setMatrixAt(index, placement.matrix);
    mesh.setColorAt(index, colour.set(relationColours[planetRelation(planet.ownerId, myId)]));
  };
  const update = (planets: readonly PlanetSnapshot[], selection: PlanetId | null) => {
    let changed = false;
    planets.forEach((planet, index) => {
      const selectionChanged = planet.id === selection || planet.id === shownSelection;
      if (planet !== shownPlanets[index] || (selection !== shownSelection && selectionChanged)) {
        writeInstance(index, planet, planet.id === selection);
        changed = true;
      }
    });
    shownPlanets = planets;
    shownSelection = selection;
    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor !== null) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.computeBoundingSphere();
    }
  };
  update(match.planets, selectedSourceId);
  return {
    mesh,
    radius,
    update,
    planetIdAt: (instanceId) => planetIds[instanceId],
    dispose: () => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
