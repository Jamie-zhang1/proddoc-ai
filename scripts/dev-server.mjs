import http from "node:http";
import { fileURLToPath } from "node:url";
import next from "next";

function readPort() {
  const portFlagIndex = process.argv.findIndex(
    (arg) => arg === "--port" || arg === "-p"
  );
  const portValue = portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : undefined;
  const rawPort = portValue || process.env.PORT || "3000";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid port: ${rawPort}`);
  }

  return port;
}

process.env.NODE_ENV = "development";
process.env.NEXT_RUNTIME = "nodejs";

export async function startCustomDevServer({
  port = readPort(),
  hostname = "localhost",
} = {}) {
  const app = next({ dev: true, dir: process.cwd(), hostname, port, webpack: true });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  await new Promise((resolveListen) => {
    server.listen(port, hostname, resolveListen);
  });

  console.log(`Next.js custom dev server ready at http://${hostname}:${port}`);

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startCustomDevServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
