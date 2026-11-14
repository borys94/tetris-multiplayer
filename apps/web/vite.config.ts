import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // W trybie dev gra łączy się z serwerem (`yarn workspace @tetris/server dev`) przez proxy Vite.
  server: {
    proxy: { "/ws": { target: "ws://localhost:3000", ws: true } },
  },
  test: { name: "web", environment: "jsdom" },
});
