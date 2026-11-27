import { BufferGeometry, Color, Float32BufferAttribute, LineBasicMaterial, LineSegments } from "three";
import type { PlayerId } from "@node-stream/shared";
import { relationColours } from "../palette/relationColours.js";
import { findPlanet, planetRelation } from "../state/index.js";
import type { MatchView } from "../state/index.js";
export interface LinkLines {
  readonly lines: LineSegments;
  update(match: MatchView, myId: PlayerId): void;
  dispose(): void;
}
const valuesPerSegment = 6;
export function createLinkLines(): LinkLines {
  const geometry = new BufferGeometry();
  const material = new LineBasicMaterial({ vertexColors: true });
  const lines = new LineSegments(geometry, material);
  lines.frustumCulled = false;
  const colour = new Color();
  return {
    lines,
    update: (match, myId) => {
      const positions = new Float32Array(match.links.length * valuesPerSegment);
      const colours = new Float32Array(match.links.length * valuesPerSegment);
      let offset = 0;
      for (const link of match.links) {
        const from = findPlanet(match, link.from);
        const to = findPlanet(match, link.to);
        if (from === undefined || to === undefined) {
          continue;
        }
        colour.set(relationColours[planetRelation(from.ownerId, myId)]);
        positions.set([from.position.x, from.position.y, from.position.z, to.position.x, to.position.y, to.position.z], offset);
        colours.set([colour.r, colour.g, colour.b, colour.r, colour.g, colour.b], offset);
        offset += valuesPerSegment;
      }
      geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new Float32BufferAttribute(colours, 3));
      geometry.setDrawRange(0, offset / 3);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
