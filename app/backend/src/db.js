// Tier 3 connection: everything about talking to MongoDB lives here.

import mongoose from "mongoose";
import config from "./config.js";
import logger from "./utils/logger.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Remove the password from the URI before logging it.
const safeUri = (uri) => uri.replace(/\/\/([^@/]+)@/, "//***@");

// Log connection changes so problems are easy to spot in `kubectl logs`.
mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
mongoose.connection.on("error", (err) => logger.error("MongoDB error", err.message));

/**
 * Connect to MongoDB, retrying until it works.
 *
 * In Docker and Kubernetes the database often starts *after* the API.
 * Instead of crashing, we keep trying. Meanwhile the API stays up and
 * reports "not ready" on its health endpoint.
 */
export async function connectToDatabase() {
  const { uri, username, password, retryDelayMs } = config.mongo;

  const options = {
    // Give up on a single attempt after 5 s instead of the 30 s default.
    serverSelectionTimeoutMS: 5000,
  };
  if (username) {
    options.user = username;
    options.pass = password;
    // The MongoDB root user is created in the "admin" database.
    options.authSource = "admin";
  }

  for (let attempt = 1; ; attempt++) {
    try {
      logger.info(`Connecting to MongoDB at ${safeUri(uri)} (attempt ${attempt})...`);
      await mongoose.connect(uri, options);
      logger.info("Connected to MongoDB");
      return;
    } catch (err) {
      logger.warn(
        `MongoDB connection failed: ${err.message}. Retrying in ${retryDelayMs / 1000}s`
      );
      await sleep(retryDelayMs);
    }
  }
}

export function isDatabaseConnected() {
  // 1 = connected (0 = disconnected, 2 = connecting, 3 = disconnecting)
  return mongoose.connection.readyState === 1;
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect();
}
