import type { MatchConfig, PlanetId, Vector3 } from "@node-stream/shared";
import { createStream } from "../random/index.js";
import { placeOnGrid, placeRandomly } from "./placement.js";
import { findNeighbors, keepLargestGroup, removeUnderConnected } from "./reachability.js";
import { computeWorldSide } from "./worldSize.js";

export const worldStreamName = "world";

export interface WorldPlanet {
  readonly id: PlanetId;
  readonly position: Vector3;
  readonly points: number;
}

export interface World {
  readonly side: number;
  readonly planets: readonly WorldPlanet[];
}

export function generateWorld(config: MatchConfig): World {
  const stream = createStream(config.seed, worldStreamName);
  const side = computeWorldSide(config);
  const placed =
    typeof config.planetDistribution === "number"
      ? placeRandomly(config.planetDistribution, side, config, stream)
      : placeOnGrid(config.planetDistribution, side);

  const neighbors = findNeighbors(placed, config.maxHopDistance);
  const reachable = removeUnderConnected(neighbors, config.minReachablePlanets);
  const kept = keepLargestGroup(neighbors, reachable);

  const planets = placed
    .filter((_, index) => kept[index])
    .map((position, id) => ({
      id,
      position,
      points: stream.nextInt(config.planetPointsMin, config.planetPointsMax),
    }));
  return { side, planets };
}
