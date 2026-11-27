import { Box3, Sphere, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { PlanetSnapshot } from "@node-stream/shared";
const viewDirection = new Vector3(0, 0.6, 1).normalize();
const distanceRatio = 2.2;
const farRatio = 10;
const nearRatio = 0.01;
const minimumRadius = 1;
export function fitCameraToPlanets(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  planets: readonly PlanetSnapshot[],
): void {
  const box = new Box3();
  planets.forEach((planet) => box.expandByPoint(new Vector3(planet.position.x, planet.position.y, planet.position.z)));
  const sphere = box.isEmpty() ? new Sphere(new Vector3(), minimumRadius) : box.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, minimumRadius);
  camera.position.copy(sphere.center).addScaledVector(viewDirection, radius * distanceRatio);
  camera.near = radius * nearRatio;
  camera.far = radius * farRatio;
  camera.updateProjectionMatrix();
  controls.target.copy(sphere.center);
  controls.update();
}
