import { createServer } from "vite";
import { createViteConfig } from "./viteConfig.js";
const server = await createServer(createViteConfig());
await server.listen();
server.printUrls();
