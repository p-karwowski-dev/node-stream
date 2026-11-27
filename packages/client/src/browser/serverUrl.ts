const defaultServerUrl = "ws://127.0.0.1:8080";
export function resolveServerUrl(): string {
  return import.meta.env.VITE_SERVER_URL ?? defaultServerUrl;
}
