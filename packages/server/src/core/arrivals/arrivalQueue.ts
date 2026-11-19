import type { PlanetId } from "@node-stream/shared";
import type { Ship } from "../ships/index.js";
export interface InFlightShip {
  readonly ship: Ship;
  readonly from: PlanetId;
  readonly to: PlanetId;
  readonly departureTime: number;
  readonly arrivalTime: number;
}
export interface ArrivalQueue {
  readonly size: number;
  push(entry: InFlightShip): void;
  popDueBy(time: number): InFlightShip[];
  all(): InFlightShip[];
}
function arrivesBefore(first: InFlightShip, second: InFlightShip): boolean {
  return (
    first.arrivalTime < second.arrivalTime ||
    (first.arrivalTime === second.arrivalTime && first.ship.id < second.ship.id)
  );
}
function compareArrivals(first: InFlightShip, second: InFlightShip): number {
  if (arrivesBefore(first, second)) {
    return -1;
  }
  return arrivesBefore(second, first) ? 1 : 0;
}
export function createArrivalQueue(): ArrivalQueue {
  const heap: InFlightShip[] = [];
  function swap(first: number, second: number): void {
    const held = heap[first] as InFlightShip;
    heap[first] = heap[second] as InFlightShip;
    heap[second] = held;
  }
  function siftUp(start: number): void {
    let index = start;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!arrivesBefore(heap[index] as InFlightShip, heap[parent] as InFlightShip)) {
        return;
      }
      swap(index, parent);
      index = parent;
    }
  }
  function siftDown(start: number): void {
    let index = start;
    for (;;) {
      const left = index * 2 + 1;
      const right = left + 1;
      let earliest = index;
      if (left < heap.length && arrivesBefore(heap[left] as InFlightShip, heap[earliest] as InFlightShip)) {
        earliest = left;
      }
      if (right < heap.length && arrivesBefore(heap[right] as InFlightShip, heap[earliest] as InFlightShip)) {
        earliest = right;
      }
      if (earliest === index) {
        return;
      }
      swap(index, earliest);
      index = earliest;
    }
  }
  function push(entry: InFlightShip): void {
    heap.push(entry);
    siftUp(heap.length - 1);
  }
  function popEarliest(): InFlightShip | undefined {
    const earliest = heap[0];
    const last = heap.pop();
    if (earliest !== undefined && last !== undefined && heap.length > 0) {
      heap[0] = last;
      siftDown(0);
    }
    return earliest;
  }
  function popDueBy(time: number): InFlightShip[] {
    const due: InFlightShip[] = [];
    while (heap[0] !== undefined && heap[0].arrivalTime <= time) {
      due.push(popEarliest() as InFlightShip);
    }
    return due;
  }
  return {
    get size() {
      return heap.length;
    },
    push,
    popDueBy,
    all: () => [...heap].sort(compareArrivals),
  };
}
