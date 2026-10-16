# three-tier-eks-iac

A simple to-do app built as a **three-tier application**, to learn how to deploy
with Docker and Kubernetes (EKS).

```
                    ┌──────────────── Kubernetes namespace "workshop" ─────────────────┐
 Browser ──► ALB ──►│ frontend (nginx :80) ──/api──► api (Node :8080) ──► mongodb-svc  │
                    │   Tier 1: presentation         Tier 2: logic        Tier 3: data  │
                    └──────────────────────────────────────────────────────────────────┘
```

| Tier | Folder | What it does |
|---|---|---|
| 1. Frontend | [app/frontend](app/frontend) | React app. nginx serves it and forwards `/api/*` to the API. |
| 2. API | [app/backend](app/backend) | Express REST API. Checks input, talks to MongoDB, returns JSON. |
| 3. Database | [k8s_manifests/01-03](k8s_manifests) | MongoDB stores the tasks. |

**How a request travels.** The browser only ever talks to the frontend. It calls a
*relative* URL like `/api/tasks`. nginx forwards that to the `api` Service, and the API
talks to `mongodb-svc`. The API and the database have no public address.

## API

All errors use one format: `{ "error": { "message": "...", "details": [...] } }`

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/tasks` | 200 list | 503 DB down |
| GET | `/api/tasks/:id` | 200 task | 400 bad id, 404 |
| POST | `/api/tasks` `{ "title": "Buy milk" }` | 201 task | 400 invalid |
| PATCH | `/api/tasks/:id` `{ "completed": true }` | 200 task | 400, 404 |
| DELETE | `/api/tasks/:id` | 204 | 404 |
| GET | `/healthz` | 200 — process alive (liveness) | |
| GET | `/api/health` | 200 — DB connected (readiness) | 503 DB down |

## Project layout

```
app/backend/src
  server.js              start server, connect DB, graceful shutdown
  app.js                 middleware + routes, in order
  config.js              all settings from environment variables
  db.js                  MongoDB connection with retry
  models/task.js         task schema
  validation/            checks request bodies
  routes/tasks.js        /api/tasks endpoints
  routes/health.js       /healthz and /api/health
  middleware/            logging, DB check, error handler
app/frontend/src
  api/client.js          one fetch wrapper: JSON, timeout, error messages
  api/tasksApi.js        one function per endpoint
  hooks/useTasks.js      task state + logic (optimistic updates with undo)
  hooks/useHealth.js     checks /api/health every 10 s
  components/            TaskForm, TaskList, TaskItem, ErrorMessage, HealthAlert
app/frontend/nginx/      nginx config (serves the app, proxies /api)
```

---

# 1. Run locally without Docker

You need Node.js 22+ and a MongoDB on `localhost:27017`.

```bash
cd app/backend && npm install && npm run dev      # API on :8080
```

```bash
cd app/frontend && npm install && npm run dev     # app on :3000, /api forwarded to :8080
```

Run the backend tests (no database needed):

```bash
cd app/backend && npm test
```

# 2. Run all three tiers with Docker Compose

```bash
docker compose up --build
```

Open http://localhost:3000. Try `docker compose stop mongodb`: within 10 seconds a
yellow "Service problem" warning appears. Run `docker compose start mongodb` and it
disappears, and the tasks reload by themselves.

| Backend env var | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Port the API listens on |
| `MONGO_URI` | `mongodb://localhost:27017/todo` | Where MongoDB is |
| `MONGO_USERNAME` / `MONGO_PASSWORD` | empty | Login, if MongoDB needs one |

| Frontend env var | Default | Meaning |
|---|---|---|
| `BACKEND_URL` | `http://api:8080` | Where nginx forwards `/api` |

---

# 3. Deploy to Kubernetes

All manifests live in **one folder**, [k8s_manifests](k8s_manifests). Each place you
deploy to has its own small folder with its own instructions:

| Folder | Where it runs | Instructions |
|---|---|---|
| [k8s-ec2](k8s-ec2) | One EC2 server: Docker first, then k3s. Best for learning. | [k8s-ec2/README.md](k8s-ec2/README.md) |
| [k8s-eks](k8s-eks) | EKS with an AWS Application Load Balancer | [k8s-eks/README.md](k8s-eks/README.md) |

```
k8s_manifests/       every manifest (shared by both)
  mongo-disk/        optional MongoDB disk (EC2 only)
k8s-ec2/             kustomization.yaml + README  -> kubectl apply -k k8s-ec2/
k8s-eks/             kustomization.yaml + README  -> kubectl apply -k k8s-eks/
```

The deploy folders don't copy the manifests. Their `kustomization.yaml` says "use
everything in `k8s_manifests`, but change these few settings" (for example, the image
names). `kubectl apply -k` understands this out of the box.

The manifests are numbered in the order they are created:

| File | Tier | What it creates |
|---|---|---|
| `00-namespace.yaml` | — | The `workshop` namespace (a "folder" for all our resources) |
| `01-mongo-secret.yaml` | 3 | MongoDB username + password |
| `02-mongo-deployment.yaml` | 3 | The MongoDB pod (temporary storage by default) |
| `03-mongo-service.yaml` | 3 | Internal address `mongodb-svc:27017` |
| `04-api-deployment.yaml` | 2 | 2 API pods |
| `05-api-service.yaml` | 2 | Internal address `api:8080` |
| `06-frontend-deployment.yaml` | 1 | 2 nginx + React pods |
| `07-frontend-service.yaml` | 1 | Internal address `frontend:80` |
| `08-ingress.yaml` | — | The public entry point (ALB on EKS, Traefik on EC2) |
| `mongo-disk/` | 3 | **Optional.** A real disk for MongoDB, so data survives restarts. Used by `k8s-ec2` only |
