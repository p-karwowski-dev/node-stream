import { useEffect, useRef, useState } from "react";
import { createSpaceScene } from "../../scene/index.js";
import type { SceneFrame } from "../../scene/index.js";
import type { GameClient } from "../../session/index.js";
import type { ClientStore } from "../../state/index.js";
export interface SpaceViewProps {
  readonly client: GameClient;
  readonly store: ClientStore;
}
const unavailableText = "3D view unavailable: WebGL is not supported";
export function SpaceView({ client, store }: SpaceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return undefined;
    }
    const readFrame = (): SceneFrame | null => {
      const { match, identity, selectedSourceId } = store.getState();
      return match === null || identity === null
        ? null
        : { match, myId: identity.playerId, selectedSourceId, now: performance.now() };
    };
    try {
      const scene = createSpaceScene({ container, onPlanetClick: client.choosePlanet, readFrame });
      return () => scene.dispose();
    } catch {
      setUnavailable(true);
      client.showNotice(unavailableText);
      return undefined;
    }
  }, [client, store]);
  return (
    <div className="space-view" ref={containerRef}>
      {unavailable ? <p className="status">{unavailableText}</p> : null}
    </div>
  );
}
