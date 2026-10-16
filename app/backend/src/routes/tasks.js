// The /api/tasks endpoints.
//
//   GET    /api/tasks       list all tasks             -> 200
//   GET    /api/tasks/:id   get one task               -> 200 | 404
//   POST   /api/tasks       create a task              -> 201 | 400
//   PATCH  /api/tasks/:id   change title / completed   -> 200 | 400 | 404
//   DELETE /api/tasks/:id   delete a task              -> 204 | 404
//
// Express 5 passes errors thrown inside async handlers to the error handler
// automatically, so there is no try/catch here.

import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/task.js";
import { validateNewTask, validateTaskUpdate } from "../validation/taskValidation.js";
import { badRequest, notFound } from "../utils/HttpError.js";

const router = Router();

// Runs before any route that has ":id" in its path.
// Stops bad ids early with a clear message.
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return next(badRequest(`"${id}" is not a valid task id.`));
  }
  next();
});

router.get("/", async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: 1 });
  res.json(tasks);
});

router.get("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw notFound("Task not found.");
  res.json(task);
});

router.post("/", async (req, res) => {
  const data = validateNewTask(req.body);
  const task = await Task.create(data);
  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const changes = validateTaskUpdate(req.body);
  const task = await Task.findByIdAndUpdate(req.params.id, changes, {
    returnDocument: "after", // return the task AFTER the change
    runValidators: true,
  });
  if (!task) throw notFound("Task not found.");
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw notFound("Task not found.");
  res.status(204).end();
});

export default router;
