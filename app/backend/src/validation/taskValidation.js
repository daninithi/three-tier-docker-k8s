// Check incoming data BEFORE it reaches the database.
// Each function returns a clean object containing only allowed fields,
// or throws a 400 Bad Request that lists every problem found.

import { badRequest } from "../utils/HttpError.js";
import { TITLE_MAX_LENGTH } from "../models/task.js";

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function checkTitle(title, errors) {
  if (typeof title !== "string") {
    errors.push({ field: "title", message: "Title must be text." });
    return undefined;
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    errors.push({ field: "title", message: "Title cannot be empty." });
  } else if (trimmed.length > TITLE_MAX_LENGTH) {
    errors.push({
      field: "title",
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }
  return trimmed;
}

function checkCompleted(completed, errors) {
  if (typeof completed !== "boolean") {
    errors.push({ field: "completed", message: "Completed must be true or false." });
  }
  return completed;
}

function rejectUnknownFields(body, allowed, errors) {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      errors.push({ field: key, message: `Unknown field "${key}".` });
    }
  }
}

/** Body for POST /api/tasks — needs a title. */
export function validateNewTask(body) {
  if (!isPlainObject(body)) {
    throw badRequest("Request body must be a JSON object.");
  }

  const errors = [];
  rejectUnknownFields(body, ["title"], errors);
  const title = checkTitle(body.title, errors);

  if (errors.length > 0) throw badRequest("Invalid task data.", errors);
  return { title };
}

/** Body for PATCH /api/tasks/:id — any of title / completed, at least one. */
export function validateTaskUpdate(body) {
  if (!isPlainObject(body)) {
    throw badRequest("Request body must be a JSON object.");
  }

  const errors = [];
  const changes = {};
  rejectUnknownFields(body, ["title", "completed"], errors);
  if ("title" in body) changes.title = checkTitle(body.title, errors);
  if ("completed" in body) changes.completed = checkCompleted(body.completed, errors);

  if (errors.length === 0 && Object.keys(changes).length === 0) {
    errors.push({ field: null, message: "Send at least one of: title, completed." });
  }

  if (errors.length > 0) throw badRequest("Invalid task data.", errors);
  return changes;
}
