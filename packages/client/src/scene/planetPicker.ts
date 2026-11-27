import { Raycaster, Vector2 } from "three";
import type { Camera } from "three";
import type { PlanetId } from "@node-stream/shared";
import type { PlanetInstances } from "./planetInstances.js";
export interface PlanetPickerOptions {
  readonly element: HTMLElement;
  readonly camera: Camera;
  readonly planets: () => PlanetInstances | undefined;
  readonly onPick: (planetId: PlanetId) => void;
}
const clickTolerancePixels = 5;
export function attachPlanetPicker(options: PlanetPickerOptions): () => void {
  const { element, camera, planets, onPick } = options;
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let downX = 0;
  let downY = 0;
  const onPointerDown = (event: PointerEvent) => {
    downX = event.clientX;
    downY = event.clientY;
  };
  const onPointerUp = (event: PointerEvent) => {
    const instances = planets();
    if (instances === undefined || Math.hypot(event.clientX - downX, event.clientY - downY) > clickTolerancePixels) {
      return;
    }
    const bounds = element.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObject(instances.mesh, false);
    const planetId = hit?.instanceId === undefined ? undefined : instances.planetIdAt(hit.instanceId);
    if (planetId !== undefined) {
      onPick(planetId);
    }
  };
  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointerup", onPointerUp);
  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointerup", onPointerUp);
  };
}
