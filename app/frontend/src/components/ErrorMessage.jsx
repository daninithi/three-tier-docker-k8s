// Shows an error to the user, with an optional "Try again" or "Dismiss" button.
// role="alert" makes screen readers announce it.

export default function ErrorMessage({ message, onRetry, onDismiss }) {
  return (
    <div className="error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error">
          ✕
        </button>
      )}
    </div>
  );
}
