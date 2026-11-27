import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { PlanetId } from "@node-stream/shared";
import { fitCameraToPlanets } from "./cameraFit.js";
import { attachPlanetPicker } from "./planetPicker.js";
import type { SceneFrame } from "./sceneFrame.js";
import { createSceneWorld } from "./sceneWorld.js";
import type { SceneWorld } from "./sceneWorld.js";
export interface SpaceSceneOptions {
  readonly container: HTMLElement;
  readonly onPlanetClick: (planetId: PlanetId) => void;
  readonly readFrame: () => SceneFrame | null;
}
export interface SpaceScene {
  dispose(): void;
}
const fieldOfViewDegrees = 50;
const backgroundColour = 0x000000;
export function createSpaceScene(options: SpaceSceneOptions): SpaceScene {
  const { container, onPlanetClick, readFrame } = options;
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(backgroundColour);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "label-layer";
  container.append(renderer.domElement, labelRenderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(fieldOfViewDegrees, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  let world: SceneWorld | undefined;
  const resize = () => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const detachPicker = attachPlanetPicker({
    element: renderer.domElement,
    camera,
    planets: () => world?.planets,
    onPick: onPlanetClick,
  });
  renderer.setAnimationLoop(() => {
    const frame = readFrame();
    if (frame === null) {
      return;
    }
    if (world?.worldKey !== frame.match.worldKey) {
      world?.dispose();
      world = createSceneWorld(scene, frame);
      fitCameraToPlanets(camera, controls, frame.match.planets);
    }
    world.draw(frame);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  });
  return {
    dispose: () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      detachPicker();
      controls.dispose();
      world?.dispose();
      world = undefined;
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
    },
  };
}
