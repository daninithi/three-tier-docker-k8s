# Deploy on one EC2 server (Docker, then Kubernetes)

One server, two stages. First run the app with Docker Compose, then run the same
app on **k3s** — a small but real Kubernetes that installs with one command and comes
with its own ingress controller (Traefik).

The manifests themselves live in [../k8s_manifests](../k8s_manifests). This folder only
holds [kustomization.yaml](kustomization.yaml). The shared manifests already use Traefik and
`imagePullPolicy: IfNotPresent`; this folder adds:

| Change | Why |
|---|---|
| Images `three-tier-*:v2` | Images are built on the server, no registry needed |
| Switches on the MongoDB disk ([mongo-disk](../k8s_manifests/mongo-disk)) | Tasks survive when the database pod restarts |

All commands below that start with `cd ~/app` or `kubectl` run **on the EC2 server**.

## Step 1 — Launch the server (AWS Console → EC2 → Launch instance)

- **Image:** Ubuntu 24.04 LTS
- **Type:** `t3.medium` (4 GB RAM). 2 GB is too small for k3s + MongoDB + image builds.
- **Key pair:** create one and download the `.pem` file.
- **Disk:** 20 GB
- **Security group** (the server's firewall), inbound rules:

| Port | Source | For |
|---|---|---|
| 22 (SSH) | My IP | Logging in |
| 3000 | Anywhere | Stage A (Docker Compose) |
| 80 (HTTP) | Anywhere | Stage B (k3s / Traefik) |

Do **not** open 6443, 8080 or 27017. The API, database and Kubernetes control
stay private.

## Step 2 — Log in and install Docker

On your Mac:

```bash
chmod 400 my-key.pem
```

```bash
ssh -i my-key.pem ubuntu@<PUBLIC_IP>
```

On the server:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

```bash
sudo usermod -aG docker ubuntu
```

Log out (`exit`) and log in again, so you can run `docker` without `sudo`.

## Step 3 — Copy the project to the server

Either `git clone` your repo on the server, or copy it from your Mac (run on the Mac,
from the project's top folder):

```bash
rsync -av --exclude node_modules --exclude .DS_Store -e "ssh -i my-key.pem" ./ ubuntu@<PUBLIC_IP>:~/app
```

## Stage A — Docker

```bash
cd ~/app && docker compose up -d --build
```

```bash
docker compose ps
```

Open `http://<PUBLIC_IP>:3000`. Things to try: `docker compose logs -f api`,
`docker compose stop mongodb` (a warning appears), `docker compose start mongodb`.

When you are done, stop it to free memory and ports for Stage B:

```bash
docker compose down
```

## Stage B — Kubernetes (k3s)

Install k3s. `--write-kubeconfig-mode 644` lets you run `kubectl` without `sudo`.

```bash
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
```

```bash
kubectl get nodes
```

Build the images with Docker. Building on the server also avoids the Apple Silicon
(arm64) vs EC2 (amd64) mismatch.

```bash
cd ~/app && docker build -t three-tier-backend:v2 app/backend && docker build -t three-tier-frontend:v2 app/frontend
```

k3s does not use Docker's images. It has its own image store (containerd), so hand
the images over:

```bash
docker save three-tier-backend:v2 three-tier-frontend:v2 | sudo k3s ctr images import -
```

Deploy everything and watch the pods start (Ctrl+C to stop watching):

```bash
kubectl apply -k k8s-ec2/
```

```bash
kubectl -n workshop get pods -w
```

When every pod shows `READY 1/1`, open `http://<PUBLIC_IP>` (port 80).

## Things to try

| Try this | What you learn |
|---|---|
| `kubectl -n workshop delete pod -l role=api` | Kubernetes replaces deleted pods by itself |
| `kubectl -n workshop scale deploy/api --replicas=3` | Scaling is one command |
| `kubectl -n workshop scale deploy/mongodb --replicas=0`, then `=1` | Warning shows, then goes; tasks are still there (the disk) |
| `kubectl -n workshop logs -l role=api --tail=50` | Reading logs |

## Ship a new version

Build with a new tag (e.g. `v3`), import it into k3s, change `newTag` in
[kustomization.yaml](kustomization.yaml), then run `kubectl apply -k k8s-ec2/` again.

## Clean up

```bash
kubectl delete -k k8s-ec2/
```

**Stop the EC2 instance** when you are not using it — you pay for every hour it runs.

## Troubleshooting

- A pod stuck in `ErrImagePull` / `ImagePullBackOff`: the image wasn't imported into k3s.
  Check with `sudo k3s ctr images ls | grep three-tier` and repeat the import step.
- An API pod at `0/1` READY usually means it can't reach MongoDB:
  `kubectl -n workshop logs -l role=api --tail=50`.
- Anything else: `kubectl -n workshop describe pod <pod-name>` and read the "Events" at the bottom.
