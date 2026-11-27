import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { resolveServerUrl } from "./browser/serverUrl.js";
import { createSessionTokenStore } from "./browser/sessionTokenStore.js";
import { createGameClient } from "./session/index.js";
import { createClientStore, initialClientState } from "./state/index.js";
import { App } from "./ui/App.js";
import "./ui/layout.css";
const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("The page has no #root element");
}
const tokens = createSessionTokenStore(window.sessionStorage);
const store = createClientStore(initialClientState(tokens.load() !== null));
const client = createGameClient({ url: resolveServerUrl(), tokens, store, now: () => performance.now() });
client.connect();
createRoot(rootElement).render(
  <StrictMode>
    <App client={client} store={store} />
  </StrictMode>,
);
