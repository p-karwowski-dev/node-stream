import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { InlineConfig } from "vite";
const clientRoot = fileURLToPath(new URL("..", import.meta.url));
const devServerHost = "127.0.0.1";
const devServerPort = 5173;
export function createViteConfig(): InlineConfig {
  return {
    configFile: false,
    root: clientRoot,
    plugins: [react()],
    server: { host: devServerHost, port: devServerPort, strictPort: true },
    build: { outDir: "dist/app", emptyOutDir: true },
  };
}
