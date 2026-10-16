// Entry point: start the HTTP server, connect to MongoDB, and shut down cleanly.

import config from "./config.js";
import logger from "./utils/logger.js";
import { createApp } from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./db.js";

const app = createApp();

// 1. Start listening right away, so the liveness check (/healthz) passes
//    even while we are still waiting for MongoDB.
const server = app.listen(config.port, () => {
  logger.info(`API listening on port ${config.port}`);
});

// 2. Connect to MongoDB in the background (retries until it succeeds).
//    Until then, /api/health reports 503 and Kubernetes holds back traffic.
connectToDatabase();

// 3. Graceful shutdown.
//    Kubernetes sends SIGTERM before stopping a pod (e.g. during a rolling update).
//    We stop taking new requests, let in-flight ones finish, close the DB, then exit.
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down...`);

  // If something hangs, force exit before Kubernetes kills us (default 30 s).
  setTimeout(() => {
    logger.error("Shutdown took too long, forcing exit");
    process.exit(1);
  }, 10_000).unref();

  server.close(async () => {
    await disconnectFromDatabase();
    logger.info("Shutdown complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Last line of defence: log the bug and exit so the container is restarted cleanly.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
  process.exit(1);
});
