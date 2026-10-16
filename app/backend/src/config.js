// All settings come from environment variables.
// This lets the same Docker image run on a laptop, in Docker Compose, or in Kubernetes
// without changing any code — only the environment changes.

const config = {
  port: Number(process.env.PORT) || 8080,

  mongo: {
    // Example: mongodb://mongodb-svc:27017/todo
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/todo",
    // Optional. When set, the API logs in to MongoDB with these credentials.
    username: process.env.MONGO_USERNAME || "",
    password: process.env.MONGO_PASSWORD || "",
    // How long to wait between connection attempts when MongoDB is not ready yet.
    retryDelayMs: Number(process.env.MONGO_RETRY_DELAY_MS) || 5000,
  },
};

export default config;
