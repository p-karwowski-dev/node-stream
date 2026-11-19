import type { MatchConfig, Vector3 } from "@node-stream/shared";
import type { RandomStream } from "../random/index.js";
import { squaredDistance } from "./distance.js";
import { createSpatialIndex } from "./spatialIndex.js";
import { placementAttemptsPerPlanet } from "./worldSize.js";

export function placeOnGrid(counts: readonly [number, number, number], side: number): Vector3[] {
  const [countX, countY, countZ] = counts;
  const positions: Vector3[] = [];
  for (let indexZ = 0; indexZ < countZ; indexZ += 1) {
    for (let indexY = 0; indexY < countY; indexY += 1) {
      for (let indexX = 0; indexX < countX; indexX += 1) {
        positions.push({
          x: ((indexX + 0.5) * side) / countX,
          y: ((indexY + 0.5) * side) / countY,
          z: ((indexZ + 0.5) * side) / countZ,
        });
      }
    }
  }
  return positions;
}

export function placeRandomly(
  requestedCount: number,
  side: number,
  config: MatchConfig,
  stream: RandomStream,
): Vector3[] {
  const index = createSpatialIndex(config.maxHopDistance);
  const positions: Vector3[] = [];
  const minimumSquared = config.minPlanetDistance * config.minPlanetDistance;
  const attemptLimit = placementAttemptsPerPlanet * requestedCount;
  for (let attempt = 0; attempt < attemptLimit && positions.length < requestedCount; attempt += 1) {
    const candidate = {
      x: stream.nextFloat() * side,
      y: stream.nextFloat() * side,
      z: stream.nextFloat() * side,
    };
    const tooClose = index
      .findWithin(candidate, config.minPlanetDistance)
      .some((other) => {
        const placed = positions[other];
        return placed !== undefined && squaredDistance(placed, candidate) < minimumSquared;
      });
    if (!tooClose) {
      index.add(candidate);
      positions.push(candidate);
    }
  }
  return positions;
}
