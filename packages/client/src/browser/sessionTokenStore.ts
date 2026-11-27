import type { TokenStore } from "../session/index.js";
const tokenKey = "node-stream.token";
export function createSessionTokenStore(storage: Storage): TokenStore {
  return {
    load: () => storage.getItem(tokenKey),
    save: (token) => storage.setItem(tokenKey, token),
    clear: () => storage.removeItem(tokenKey),
  };
}
