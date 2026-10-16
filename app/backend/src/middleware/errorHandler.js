// The single place where errors become HTTP responses.
//
// Every error response has the same shape, so the frontend only needs
// one piece of code to read it:
//
//   { "error": { "message": "Invalid task data.", "details": [ ... ] } }

import { HttpError } from "../utils/HttpError.js";
import logger from "../utils/logger.js";

/** Requests that match no route end up here. */
export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} does not exist.`));
}

/** Turn any error into { status, message, details }. */
function toHttpError(err) {
  if (err instanceof HttpError) return err;

  // Body was not valid JSON (thrown by express.json()).
  if (err.type === "entity.parse.failed") {
    return new HttpError(400, "Request body is not valid JSON.");
  }
  // Body was bigger than the limit set in express.json().
  if (err.type === "entity.too.large") {
    return new HttpError(413, "Request body is too large.");
  }
  // Mongoose rejected the data (safety net — validation usually catches this first).
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new HttpError(400, "Invalid task data.", details);
  }
  // Could not reach MongoDB in time.
  if (err.name === "MongoServerSelectionError" || err.name === "MongoNetworkError") {
    return new HttpError(503, "The database is not available. Please try again shortly.");
  }

  return null; // unexpected error
}

// Express knows this is an error handler because it has 4 arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const httpError = toHttpError(err);

  if (!httpError) {
    // A real bug. Log the full details for us, but never send them to the user.
    logger.error(`Unexpected error on ${req.method} ${req.originalUrl}`, err);
    return res.status(500).json({ error: { message: "Something went wrong on the server." } });
  }

  if (httpError.status >= 500) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${httpError.status}: ${httpError.message}`);
  }

  const body = { message: httpError.message };
  if (httpError.details) body.details = httpError.details;
  res.status(httpError.status).json({ error: body });
}
