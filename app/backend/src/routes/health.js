// Health endpoints, used by Docker / Kubernetes and by the frontend.
//
//   GET /healthz     "Is the process alive?"          Kubernetes livenessProbe
//                    Always 200 while the server runs. If it stops answering,
//                    Kubernetes restarts the container.
//
//   GET /api/health  "Can the API do real work?"       Kubernetes readinessProbe
//                    200 only when MongoDB is connected, otherwise 503.
//                    While not ready, Kubernetes stops sending traffic to this pod.
//                    The frontend also calls it to show the status of all tiers.

import { Router } from "express";
import { isDatabaseConnected } from "../db.js";

const router = Router();

router.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/api/health", (req, res) => {
  const databaseUp = isDatabaseConnected();
  res.status(databaseUp ? 200 : 503).json({
    status: databaseUp ? "ok" : "unavailable",
    api: "up",
    database: databaseUp ? "connected" : "disconnected",
  });
});

export default router;
