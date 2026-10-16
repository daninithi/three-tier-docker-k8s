# Tier 1 image: the React app, served by nginx.
#
# This is a "multi-stage" build:
#   Stage 1 uses Node.js to BUILD the app into plain HTML/JS/CSS files.
#   Stage 2 copies only those files into a tiny nginx image.
# Node.js and node_modules never reach the final image, so it stays small (~50 MB).

# ---------- Stage 1: build ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
# Output: /app/dist

# ---------- Stage 2: serve ----------
FROM nginx:1.29-alpine

# Where nginx forwards /api requests. Override it at run time if your backend has another name.
ENV BACKEND_URL=http://api:8080

# The nginx image fills in ${BACKEND_URL} in templates when the container starts.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s \
  CMD wget -qO- http://localhost/nginx-health || exit 1
