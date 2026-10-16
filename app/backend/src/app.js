// Builds the Express app: which middleware runs, in which order, and which routes exist.
// It does NOT start listening — server.js does that. Keeping them apart
// makes the app easy to test.
//
// A request flows top to bottom through this list:
//
//   express.json  ->  requestLogger  ->  routes  ->  notFoundHandler  ->  errorHandler

import express from "express";
import healthRouter from "./routes/health.js";
import tasksRouter from "./routes/tasks.js";
import requestLogger from "./middleware/requestLogger.js";
import requireDatabase from "./middleware/requireDatabase.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by"); // don't advertise that we use Express

  app.use(express.json({ limit: "10kb" })); // read JSON bodies, reject huge ones
  app.use(requestLogger);

  app.use(healthRouter);
  app.use("/api/tasks", requireDatabase, tasksRouter);

  app.use(notFoundHandler); // no route matched
  app.use(errorHandler); // must be last

  return app;
}
