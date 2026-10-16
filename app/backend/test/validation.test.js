import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNewTask, validateTaskUpdate } from "../src/validation/taskValidation.js";

test("new task: trims the title", () => {
  assert.deepEqual(validateNewTask({ title: "  Buy milk  " }), { title: "Buy milk" });
});

test("new task: rejects empty, missing, too long and non-text titles", () => {
  for (const body of [{ title: "   " }, {}, { title: "x".repeat(201) }, { title: 42 }]) {
    assert.throws(() => validateNewTask(body), { status: 400 });
  }
});

test("new task: rejects unknown fields", () => {
  assert.throws(() => validateNewTask({ title: "ok", completed: true }), (err) => {
    assert.equal(err.status, 400);
    assert.equal(err.details[0].field, "completed");
    return true;
  });
});

test("update: accepts title and/or completed", () => {
  assert.deepEqual(validateTaskUpdate({ completed: true }), { completed: true });
  assert.deepEqual(validateTaskUpdate({ title: " a ", completed: false }), {
    title: "a",
    completed: false,
  });
});

test("update: rejects empty body, wrong types and Mongo operators", () => {
  for (const body of [{}, { completed: "yes" }, { $set: { title: "x" } }, [], null]) {
    assert.throws(() => validateTaskUpdate(body), { status: 400 });
  }
});
