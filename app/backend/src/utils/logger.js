// A tiny logger that adds a timestamp and level to every line.
// Containers should log to stdout/stderr; Docker and Kubernetes collect it from there
// (that is what `docker logs` and `kubectl logs` show you).

function write(stream, level, message, extra) {
  const line = `${new Date().toISOString()} [${level}] ${message}`;
  if (extra !== undefined) {
    stream.write(`${line} ${extra instanceof Error ? extra.stack : JSON.stringify(extra)}\n`);
  } else {
    stream.write(`${line}\n`);
  }
}

const logger = {
  info: (message, extra) => write(process.stdout, "INFO", message, extra),
  warn: (message, extra) => write(process.stderr, "WARN", message, extra),
  error: (message, extra) => write(process.stderr, "ERROR", message, extra),
};

export default logger;
