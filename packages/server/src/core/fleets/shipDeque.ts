import type { Ship } from "../ships/index.js";
export interface ShipDeque {
  readonly length: number;
  pushBack(ship: Ship): void;
  popFront(): Ship | undefined;
  removeFront(count: number): void;
  clear(): void;
}
const initialCapacity = 4;
function emptySlots(capacity: number): (Ship | undefined)[] {
  return new Array<Ship | undefined>(capacity).fill(undefined);
}
export function createShipDeque(): ShipDeque {
  let slots = emptySlots(initialCapacity);
  let head = 0;
  let size = 0;
  function slotIndex(offset: number): number {
    return (head + offset) & (slots.length - 1);
  }
  function grow(): void {
    const next = emptySlots(slots.length * 2);
    for (let offset = 0; offset < size; offset += 1) {
      next[offset] = slots[slotIndex(offset)];
    }
    slots = next;
    head = 0;
  }
  function pushBack(ship: Ship): void {
    if (size === slots.length) {
      grow();
    }
    slots[slotIndex(size)] = ship;
    size += 1;
  }
  function popFront(): Ship | undefined {
    if (size === 0) {
      return undefined;
    }
    const ship = slots[head];
    slots[head] = undefined;
    head = slotIndex(1);
    size -= 1;
    return ship;
  }
  function removeFront(count: number): void {
    const removing = Math.min(Math.max(0, count), size);
    for (let offset = 0; offset < removing; offset += 1) {
      slots[slotIndex(offset)] = undefined;
    }
    head = slotIndex(removing);
    size -= removing;
  }
  function clear(): void {
    slots = emptySlots(initialCapacity);
    head = 0;
    size = 0;
  }
  return {
    get length() {
      return size;
    },
    pushBack,
    popFront,
    removeFront,
    clear,
  };
}
