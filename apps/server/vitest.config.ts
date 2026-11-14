import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "server",
    environment: "node",
    // Postgres z Testcontainers (wymaga Dockera); start kontenera trwa kilka sekund.
    globalSetup: ["./test/global-setup.ts"],
    hookTimeout: 60_000,
  },
});
