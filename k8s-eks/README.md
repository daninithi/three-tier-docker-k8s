# Deploy on EKS with an AWS load balancer

EKS is AWS's managed Kubernetes. The public entry point is an **Application Load
Balancer (ALB)**, created automatically from [08-ingress.yaml](../k8s_manifests/08-ingress.yaml).

The manifests themselves live in [../k8s_manifests](../k8s_manifests).
This folder only holds [kustomization.yaml](kustomization.yaml), which sets your image registry.
It does not switch on the optional MongoDB disk ([mongo-disk](../k8s_manifests/mongo-disk)), so you
don't need the EBS CSI driver add-on. The catch: tasks are lost whenever the MongoDB pod restarts. Fine for a demo.

## What you need first

| Need | Why |
|---|---|
| An EKS cluster, and `kubectl` pointed at it (`aws eks update-kubeconfig --name <cluster>`) | Somewhere to run the app |
| The **AWS Load Balancer Controller** installed in the cluster | It turns the Ingress into a real ALB |
| Two ECR repositories: `three-tier-backend` and `three-tier-frontend` | Where the images are stored |

Create the ECR repositories (once):

```bash
aws ecr create-repository --repository-name three-tier-backend
```

```bash
aws ecr create-repository --repository-name three-tier-frontend
```

## Step 1 — Build and push the images

Replace `123456789012` and `us-east-1` with your AWS account ID and region. Log in to ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
```

Build and push. `--platform linux/amd64` matters on Apple Silicon Macs, because EKS
nodes are usually amd64.

```bash
docker buildx build --platform linux/amd64 -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/three-tier-backend:v2 --push app/backend
```

```bash
docker buildx build --platform linux/amd64 -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/three-tier-frontend:v2 --push app/frontend
```

## Step 2 — Set your image names

In [kustomization.yaml](kustomization.yaml), replace
`123456789012.dkr.ecr.us-east-1.amazonaws.com` with your own registry address.

## Step 3 — Deploy

```bash
kubectl apply -k k8s-eks/
```

Make `workshop` your default namespace, so you don't have to type `-n workshop` every time:

```bash
kubectl config set-context --current --namespace workshop
```

Get the public address (it takes a minute or two to appear):

```bash
kubectl get ingress mainlb
```

Open the `ADDRESS` shown there in your browser.

The secret holds demo credentials (`admin` / `password123`). Change them for anything real.

## Ship a new version

Push images with a new tag (e.g. `v3`), change `newTag` in [kustomization.yaml](kustomization.yaml),
then run `kubectl apply -k k8s-eks/` again.

## Clean up

```bash
kubectl delete -k k8s-eks/
```

This also deletes the ALB. Delete the EKS cluster itself when you're done — it costs money every hour.

## Troubleshooting

See whether every pod is `Running` and `READY 1/1`:

```bash
kubectl get pods
```

- An API pod at `0/1` READY usually means it can't reach MongoDB: `kubectl logs -l role=api --tail=50`.
- No address on the Ingress: check the AWS Load Balancer Controller is running
  (`kubectl -n kube-system get deploy aws-load-balancer-controller`).
