// Asks the backend every few seconds: "are you up, and is the database up?"
// The page uses the answer to warn the user when something is down,
// and to reload the tasks automatically once everything is back.
//
//   status = "checking" | "ok" | "db-down" | "api-down"

import { useEffect, useState } from "react";
import { getHealth } from "../api/tasksApi.js";

const CHECK_EVERY_MS = 10_000;

export function useHealth() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await getHealth();
        if (!cancelled) setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        // 503 from the API itself = the API is running but MongoDB is not.
        // Anything else (no response, 502 from nginx) = the API is not reachable.
        setStatus(err.status === 503 ? "db-down" : "api-down");
      }
    }

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return status;
}
