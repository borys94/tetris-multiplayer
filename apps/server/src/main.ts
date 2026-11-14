import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3000);
const version = process.env.APP_VERSION ?? "dev";
const staticDir = process.env.STATIC_DIR;

const app = createApp(staticDir ? { version, staticDir } : { version });

const server = app.listen(port, () => {
  console.log(`server ${version} listening on http://localhost:${port}`);
});

// Kubernetes wysyła SIGTERM przed zatrzymaniem poda: kończymy trwające żądania i wychodzimy.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
