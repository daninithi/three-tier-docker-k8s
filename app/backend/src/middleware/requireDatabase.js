// If MongoDB is down, answer straight away with 503 "Service Unavailable"
// instead of letting the request hang until a database timeout.

import { isDatabaseConnected } from "../db.js";
import { serviceUnavailable } from "../utils/HttpError.js";

export default function requireDatabase(req, res, next) {
  if (!isDatabaseConnected()) {
    return next(serviceUnavailable("The database is not available. Please try again shortly."));
  }
  next();
}
