// These tests run WITHOUT a database, to check how the API behaves when MongoDB is down.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0); // port 0 = pick any free port
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test("GET /healthz is always ok", async () => {
  const res = await fetch(`${baseUrl}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("GET /api/health reports 503 when the database is down", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).database, "disconnected");
});

test("task routes answer 503 with a JSON error when the database is down", async () => {
  const res = await fetch(`${baseUrl}/api/tasks`);
  assert.equal(res.status, 503);
  assert.match((await res.json()).error.message, /database is not available/);
});

test("unknown routes answer 404 with a JSON error", async () => {
  const res = await fetch(`${baseUrl}/nope`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error.message);
});
