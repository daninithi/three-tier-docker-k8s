// The page layout. It wires the hooks (data + logic) to the components (display).

import { useEffect, useRef } from "react";
import { useTasks } from "./hooks/useTasks.js";
import { useHealth } from "./hooks/useHealth.js";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";
import HealthAlert from "./components/HealthAlert.jsx";

export default function App() {
  const {
    tasks,
    isLoading,
    loadError,
    actionError,
    reload,
    addTask,
    toggleTask,
    removeTask,
    dismissActionError,
  } = useTasks();

  const health = useHealth();
  const systemDown = health === "db-down" || health === "api-down";

  // When the system comes back after being down, reload the tasks automatically.
  const previousHealth = useRef(health);
  useEffect(() => {
    const wasDown = previousHealth.current === "db-down" || previousHealth.current === "api-down";
    if (wasDown && health === "ok") reload();
    previousHealth.current = health;
  }, [health, reload]);

  const remaining = tasks.filter((t) => !t.completed).length;

  return (
    <main className="page">
      <section className="card">
        <header className="card-header">
          <h1>To-Do</h1>
          {!isLoading && !loadError && (
            <span className="counter">
              {remaining} of {tasks.length} left
            </span>
          )}
        </header>

        <HealthAlert status={health} />

        <TaskForm onAdd={addTask} disabled={isLoading || Boolean(loadError) || systemDown} />

        {actionError && <ErrorMessage message={actionError} onDismiss={dismissActionError} />}

        {isLoading ? (
          <p className="info">Loading tasks…</p>
        ) : loadError ? (
          // While the health alert is showing, it already explains the problem.
          !systemDown && <ErrorMessage message={loadError} onRetry={reload} />
        ) : (
          <TaskList tasks={tasks} onToggle={toggleTask} onDelete={removeTask} />
        )}
      </section>
    </main>
  );
}
