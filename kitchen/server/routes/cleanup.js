import { Router } from "express";
import { planCleanup, executeCleanup } from "../openclaw.js";
import { guardOpenClaw, withErrorHandler } from "../middleware.js";

/**
 * @param {boolean} prod - Production mode (enforces X-Confirm-Destructive for execute)
 */
export function createCleanupRouter(prod) {
  const router = Router();

  router.get("/plan", withErrorHandler(async (_req, res) => {
    if (await guardOpenClaw(res)) return;
    const plan = await planCleanup();
    res.json(plan);
  }, "GET /api/cleanup/plan"));

  router.post("/execute", withErrorHandler(async (req, res) => {
    if (prod && req.get("X-Confirm-Destructive") !== "true") {
      return res.status(403).json({ error: "Destructive operation requires X-Confirm-Destructive: true" });
    }
    if (await guardOpenClaw(res)) return;
    const result = await executeCleanup();
    res.json(result);
  }, "POST /api/cleanup/execute"));

  return router;
}
