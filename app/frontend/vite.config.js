import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local development (`npm run dev`), Vite forwards every /api request
// to the backend. In Docker/Kubernetes, nginx does the same job.
// Either way the browser only ever talks to ONE address, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": process.env.API_PROXY_TARGET || "http://localhost:8080",
    },
  },
});
