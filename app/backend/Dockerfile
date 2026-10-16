# Tier 2 image: the Node.js API.
# Small Alpine-based image with the current Node.js LTS.
FROM node:24-alpine

# Tell Node and npm this is production (skips dev-only behaviour).
ENV NODE_ENV=production

WORKDIR /app

# Copy only the dependency files first. Docker caches this layer,
# so "npm ci" re-runs only when dependencies change, not on every code change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Now copy the source code.
COPY src ./src

# Do not run as root. The node image ships with a "node" user (uid 1000).
USER node

EXPOSE 8080

# Docker's own health check (Kubernetes uses its probes instead).
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

# Run node directly (not "npm start") so SIGTERM reaches our app for a clean shutdown.
CMD ["node", "src/server.js"]
