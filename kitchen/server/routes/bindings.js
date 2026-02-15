import { Router } from "express";
import { listBindings, addBinding, removeBinding } from "../openclaw.js";
import {
  guardOpenClaw,
  withErrorHandler,
  validateMatch,
  ID_RE,
} from "../middleware.js";

export function createBindingsRouter() {
  const router = Router();

  router.get("/", withErrorHandler(async (_req, res) => {
    if (await guardOpenClaw(res)) return;
    const bindings = listBindings();
    res.json(bindings);
  }, "GET /api/bindings"));

  router.post("/", withErrorHandler(async (req, res) => {
    if (await guardOpenClaw(res)) return;
    const { agentId, match } = req.body || {};
    if (!agentId || !match?.channel) {
      return res.status(400).json({ error: "Missing agentId or match.channel" });
    }
    if (!validateMatch(match, res)) return;
    if (!ID_RE.test(agentId)) {
      return res.status(400).json({ error: "Invalid agentId format" });
    }
    addBinding({ agentId, match });
    res.json({ ok: true });
  }, "POST /api/bindings", 400));

  router.delete("/", withErrorHandler(async (req, res) => {
    if (await guardOpenClaw(res)) return;
    const { agentId, match } = req.body || {};
    if (!match?.channel) {
      return res.status(400).json({ error: "Missing match.channel" });
    }
    if (!validateMatch(match, res)) return;
    if (agentId && !ID_RE.test(agentId)) {
      return res.status(400).json({ error: "Invalid agentId format" });
    }
    removeBinding({ agentId, match });
    res.json({ ok: true });
  }, "DELETE /api/bindings", 400));

  return router;
}
