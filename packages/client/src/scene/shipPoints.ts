import { BufferAttribute, BufferGeometry, Color, Points, PointsMaterial } from "three";
import type { PlayerId } from "@node-stream/shared";
import { relationColours } from "../palette/relationColours.js";
import { findPlanet, planetRelation, shipProgress } from "../state/index.js";
import type { MatchView } from "../state/index.js";
export interface ShipPoints {
  readonly points: Points;
  update(match: MatchView, myId: PlayerId, matchTime: number): void;
  dispose(): void;
}
const initialCapacity = 1024;
const shipSizeRatio = 0.1;
const valuesPerShip = 3;
export function createShipPoints(minPlanetDistance: number): ShipPoints {
  const geometry = new BufferGeometry();
  const material = new PointsMaterial({ vertexColors: true, size: minPlanetDistance * shipSizeRatio, sizeAttenuation: true });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const ownColour = new Color(relationColours.own);
  const enemyColour = new Color(relationColours.enemy);
  let capacity = 0;
  let positions = new Float32Array(0);
  let colours = new Float32Array(0);
  const ensureCapacity = (shipCount: number) => {
    if (shipCount <= capacity) {
      return;
    }
    capacity = Math.max(capacity, initialCapacity);
    while (capacity < shipCount) {
      capacity *= 2;
    }
    positions = new Float32Array(capacity * valuesPerShip);
    colours = new Float32Array(capacity * valuesPerShip);
    geometry.setAttribute("position", new BufferAttribute(positions, valuesPerShip));
    geometry.setAttribute("color", new BufferAttribute(colours, valuesPerShip));
  };
  ensureCapacity(initialCapacity);
  return {
    points,
    update: (match, myId, matchTime) => {
      ensureCapacity(match.ships.length);
      let count = 0;
      for (const ship of match.ships) {
        const from = findPlanet(match, ship.from);
        const to = findPlanet(match, ship.to);
        if (from === undefined || to === undefined) {
          continue;
        }
        const progress = shipProgress(ship, matchTime);
        const offset = count * valuesPerShip;
        positions[offset] = from.position.x + (to.position.x - from.position.x) * progress;
        positions[offset + 1] = from.position.y + (to.position.y - from.position.y) * progress;
        positions[offset + 2] = from.position.z + (to.position.z - from.position.z) * progress;
        const colour = planetRelation(ship.ownerId, myId) === "own" ? ownColour : enemyColour;
        colours[offset] = colour.r;
        colours[offset + 1] = colour.g;
        colours[offset + 2] = colour.b;
        count += 1;
      }
      const positionAttribute = geometry.getAttribute("position");
      const colourAttribute = geometry.getAttribute("color");
      positionAttribute.needsUpdate = true;
      colourAttribute.needsUpdate = true;
      geometry.setDrawRange(0, count);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
