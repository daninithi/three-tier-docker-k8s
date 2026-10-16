// Logs one line per request, e.g.  "POST /api/tasks 201 12ms".
// Health checks are skipped: Kubernetes calls them every few seconds,
// and they would drown out the useful lines.

import logger from "../utils/logger.js";

const QUIET_PATHS = new Set(["/healthz", "/api/health"]);

export default function requestLogger(req, res, next) {
  if (QUIET_PATHS.has(req.path)) return next();

  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
}
