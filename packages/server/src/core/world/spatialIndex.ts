import type { Vector3 } from "@node-stream/shared";
import { squaredDistance } from "./distance.js";

export interface SpatialIndex {
  add(position: Vector3): number;
  findWithin(center: Vector3, radius: number): number[];
}

export function createSpatialIndex(cellSize: number): SpatialIndex {
  const positions: Vector3[] = [];
  const cells = new Map<string, number[]>();

  function cellKey(cellX: number, cellY: number, cellZ: number): string {
    return `${cellX},${cellY},${cellZ}`;
  }

  function cellCoordinate(value: number): number {
    return Math.floor(value / cellSize);
  }

  function add(position: Vector3): number {
    const index = positions.length;
    positions.push(position);
    const key = cellKey(cellCoordinate(position.x), cellCoordinate(position.y), cellCoordinate(position.z));
    const members = cells.get(key);
    if (members === undefined) {
      cells.set(key, [index]);
    } else {
      members.push(index);
    }
    return index;
  }

  function findWithin(center: Vector3, radius: number): number[] {
    const found: number[] = [];
    const radiusSquared = radius * radius;
    const reach = Math.ceil(radius / cellSize);
    const centerX = cellCoordinate(center.x);
    const centerY = cellCoordinate(center.y);
    const centerZ = cellCoordinate(center.z);
    for (let cellX = centerX - reach; cellX <= centerX + reach; cellX += 1) {
      for (let cellY = centerY - reach; cellY <= centerY + reach; cellY += 1) {
        for (let cellZ = centerZ - reach; cellZ <= centerZ + reach; cellZ += 1) {
          for (const index of cells.get(cellKey(cellX, cellY, cellZ)) ?? []) {
            const candidate = positions[index];
            if (candidate !== undefined && squaredDistance(candidate, center) <= radiusSquared) {
              found.push(index);
            }
          }
        }
      }
    }
    return found.sort((first, second) => first - second);
  }

  return { add, findWithin };
}
