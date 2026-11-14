import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // W trybie dev gra i API idą do serwera (`yarn workspace @tetris/server dev`) przez proxy Vite.
  server: {
    proxy: {
      "/ws": { target: "ws://localhost:3000", ws: true },
      "/api": "http://localhost:3000",
    },
  },
  test: { name: "web", environment: "jsdom" },
});
