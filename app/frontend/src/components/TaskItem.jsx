export default function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className={task.completed ? "task done" : "task"}>
      <label>
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task)} />
        <span className="task-title">{task.title}</span>
      </label>
      <button
        type="button"
        className="delete"
        onClick={() => onDelete(task)}
        aria-label={`Delete "${task.title}"`}
      >
        Delete
      </button>
    </li>
  );
}
