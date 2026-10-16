import { useState } from "react";

// Same limit as the backend. The backend still checks it — never trust only the browser.
const TITLE_MAX_LENGTH = 200;

export default function TaskForm({ onAdd, disabled }) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = title.trim();

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    const saved = await onAdd(trimmed);
    setIsSaving(false);
    if (saved) setTitle(""); // keep the text if it failed, so the user can retry
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        maxLength={TITLE_MAX_LENGTH}
        disabled={disabled || isSaving}
        aria-label="New task"
      />
      <button type="submit" disabled={disabled || isSaving || !trimmed}>
        {isSaving ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
