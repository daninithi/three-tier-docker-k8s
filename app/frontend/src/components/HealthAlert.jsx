// A warning shown ONLY when a health check fails. When everything is fine, it shows nothing.
// role="alert" makes screen readers announce it.

const MESSAGES = {
  "db-down": "The database is down, so tasks can't be loaded or saved right now.",
  "api-down": "The server (API) can't be reached, so tasks can't be loaded or saved right now.",
};

export default function HealthAlert({ status }) {
  const message = MESSAGES[status];
  if (!message) return null; // "ok" or "checking": nothing to show

  return (
    <div className="health-alert" role="alert">
      <strong>Service problem.</strong> {message} The page will reconnect automatically.
    </div>
  );
}
