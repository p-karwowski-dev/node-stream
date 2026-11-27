import type { GameClient } from "../session/index.js";
export interface ConnectionBannerProps {
  readonly client: GameClient;
}
export function ConnectionBanner({ client }: ConnectionBannerProps) {
  return (
    <div className="banner">
      <span>Disconnected from the server</span>
      <button type="button" onClick={() => client.connect()}>
        Reconnect
      </button>
    </div>
  );
}
