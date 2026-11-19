import type { PlayerId } from "@node-stream/shared";
import type { ShipDeque } from "../fleets/index.js";
import type { ShipRegistry } from "../ships/index.js";
export function resolveShipBattle(fleets: ReadonlyMap<PlayerId, ShipDeque>, ships: ShipRegistry): void {
  const fighting = [...fleets].filter(([, fleet]) => fleet.length > 0);
  if (fighting.length < 2) {
    return;
  }
  let largestOwner: PlayerId | null = null;
  let largestSize = 0;
  let secondSize = 0;
  for (const [ownerId, fleet] of fighting) {
    if (fleet.length > largestSize) {
      secondSize = largestSize;
      largestSize = fleet.length;
      largestOwner = ownerId;
    } else if (fleet.length > secondSize) {
      secondSize = fleet.length;
    }
  }
  const survivor = largestSize > secondSize ? largestOwner : null;
  for (const [ownerId, fleet] of fighting) {
    if (ownerId === survivor) {
      fleet.removeFront(secondSize);
      ships.retire(ownerId, secondSize);
    } else {
      ships.retire(ownerId, fleet.length);
      fleet.clear();
    }
  }
}
