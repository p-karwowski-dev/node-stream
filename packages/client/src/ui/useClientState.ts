import { useSyncExternalStore } from "react";
import type { ClientState, ClientStore } from "../state/index.js";
export function useClientState(store: ClientStore): ClientState {
  return useSyncExternalStore(store.subscribe, store.getState);
}
