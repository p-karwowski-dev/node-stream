import type { ClientState } from "./clientState.js";
export interface ClientStore {
  getState(): ClientState;
  update(change: (state: ClientState) => ClientState): void;
  subscribe(listener: () => void): () => void;
}
export function createClientStore(initialState: ClientState): ClientStore {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    update: (change) => {
      const next = change(state);
      if (next === state) {
        return;
      }
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
