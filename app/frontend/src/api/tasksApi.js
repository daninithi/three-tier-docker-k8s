// Every backend endpoint the app uses, in one place.
// Components never call fetch() directly — they call these functions.

import { request } from "./client.js";

export const listTasks = () => request("/tasks");

export const createTask = (title) => request("/tasks", { method: "POST", body: { title } });

export const updateTask = (id, changes) =>
  request(`/tasks/${id}`, { method: "PATCH", body: changes });

export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });

export const getHealth = () => request("/health");
