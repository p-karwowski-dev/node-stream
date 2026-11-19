import type { Vector3 } from "@node-stream/shared";

export function squaredDistance(first: Vector3, second: Vector3): number {
  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;
  const deltaZ = first.z - second.z;
  return deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ;
}

export function distanceBetween(first: Vector3, second: Vector3): number {
  return Math.sqrt(squaredDistance(first, second));
}
