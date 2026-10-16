// One function for every call to the backend.
// It handles the boring, error-prone parts in a single place:
//   - sending and reading JSON
//   - giving up after a timeout
//   - turning ANY failure into an ApiError with a message a person can read

// Always a relative path. The browser sends it to the same server that served
// this page, and that server (nginx or the Vite dev server) forwards it to the API.
const API_BASE = "/api";
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(message, status = 0, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 means "never got a response"
    this.details = details;
  }
}

// Used when the server's reply has no message of its own.
function fallbackMessage(status) {
  if (status === 404) return "That item no longer exists.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return `Request failed (status ${status}).`;
}

export async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // No response at all: network down, server unreachable, or timeout.
    if (err.name === "TimeoutError") {
      throw new ApiError("The server took too long to answer. Please try again.");
    }
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }

  // 204 No Content (e.g. after a delete) has no body to read.
  if (response.status === 204) return null;

  // Read the body as JSON if we can. A proxy error page might be HTML instead.
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    // Our API always sends errors as { error: { message, details } }.
    const message = data?.error?.message || fallbackMessage(response.status);
    throw new ApiError(message, response.status, data?.error?.details);
  }

  return data;
}
