import type { Vector3 } from "@node-stream/shared";
import { createSpatialIndex } from "./spatialIndex.js";

export function findNeighbors(positions: readonly Vector3[], maxHopDistance: number): number[][] {
  const index = createSpatialIndex(maxHopDistance);
  positions.forEach((position) => index.add(position));
  return positions.map((position, self) =>
    index.findWithin(position, maxHopDistance).filter((other) => other !== self),
  );
}

export function removeUnderConnected(neighbors: readonly number[][], minimumNeighbors: number): boolean[] {
  const alive = neighbors.map(() => true);
  const remainingCounts = neighbors.map((list) => list.length);
  const pending: number[] = [];
  remainingCounts.forEach((count, planet) => {
    if (count < minimumNeighbors) {
      alive[planet] = false;
      pending.push(planet);
    }
  });
  while (pending.length > 0) {
    const removed = pending.pop() as number;
    for (const neighbor of neighbors[removed] ?? []) {
      if (!alive[neighbor]) {
        continue;
      }
      remainingCounts[neighbor] = (remainingCounts[neighbor] ?? 0) - 1;
      if ((remainingCounts[neighbor] ?? 0) < minimumNeighbors) {
        alive[neighbor] = false;
        pending.push(neighbor);
      }
    }
  }
  return alive;
}

export function keepLargestGroup(neighbors: readonly number[][], alive: readonly boolean[]): boolean[] {
  const groupOf: number[] = neighbors.map(() => -1);
  const groupSizes: number[] = [];
  for (let start = 0; start < neighbors.length; start += 1) {
    if (!alive[start] || groupOf[start] !== -1) {
      continue;
    }
    const group = groupSizes.length;
    let size = 0;
    const stack = [start];
    groupOf[start] = group;
    while (stack.length > 0) {
      const current = stack.pop() as number;
      size += 1;
      for (const neighbor of neighbors[current] ?? []) {
        if (alive[neighbor] && groupOf[neighbor] === -1) {
          groupOf[neighbor] = group;
          stack.push(neighbor);
        }
      }
    }
    groupSizes.push(size);
  }
  let winningGroup = -1;
  let winningSize = 0;
  groupSizes.forEach((size, group) => {
    if (size > winningSize) {
      winningGroup = group;
      winningSize = size;
    }
  });
  return neighbors.map((_, planet) => alive[planet] === true && groupOf[planet] === winningGroup);
}
