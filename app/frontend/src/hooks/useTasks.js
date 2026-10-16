// All task logic lives in this hook: loading, adding, toggling, deleting, and errors.
// Components only display data and call these functions. They don't know about the API.

import { useCallback, useEffect, useState } from "react";
import * as tasksApi from "../api/tasksApi.js";

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null); // could not load the list at all
  const [actionError, setActionError] = useState(null); // one add/update/delete failed

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setTasks(await tasksApi.listTasks());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Add: wait for the server, because we need the id it creates.
  // Returns true on success so the form knows to clear the input.
  const addTask = useCallback(async (title) => {
    setActionError(null);
    try {
      const created = await tasksApi.createTask(title);
      setTasks((current) => [...current, created]);
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  }, []);

  // Toggle and delete are "optimistic": update the screen first so it feels instant,
  // then tell the server. If the server says no, put things back the way they were.

  const toggleTask = useCallback(async (task) => {
    setActionError(null);
    const completed = !task.completed;
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, completed } : t)));

    try {
      const saved = await tasksApi.updateTask(task.id, { completed });
      setTasks((current) => current.map((t) => (t.id === saved.id ? saved : t)));
    } catch (err) {
      setTasks((current) => current.map((t) => (t.id === task.id ? task : t))); // undo
      setActionError(`Could not update "${task.title}": ${err.message}`);
    }
  }, []);

  const removeTask = useCallback(async (task) => {
    setActionError(null);
    setTasks((current) => current.filter((t) => t.id !== task.id));

    try {
      await tasksApi.deleteTask(task.id);
    } catch (err) {
      if (err.status === 404) return; // already gone on the server — that's fine
      // Undo: put the task back in its original place (the list is ordered by creation time).
      setTasks((current) =>
        [...current, task].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      );
      setActionError(`Could not delete "${task.title}": ${err.message}`);
    }
  }, []);

  return {
    tasks,
    isLoading,
    loadError,
    actionError,
    reload: loadTasks,
    addTask,
    toggleTask,
    removeTask,
    dismissActionError: () => setActionError(null),
  };
}
