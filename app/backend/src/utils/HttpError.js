// An error that already knows which HTTP status code it should produce.
// Throw one of these anywhere in a route, and the error handler middleware
// turns it into a proper JSON response.

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details; // optional extra info, e.g. which fields were invalid
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const serviceUnavailable = (message) => new HttpError(503, message);
