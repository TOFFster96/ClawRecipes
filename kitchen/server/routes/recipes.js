import { Router } from "express";
import {
  listRecipes,
  showRecipe,
  recipeStatus,
  scaffoldTeam,
  scaffoldAgent,
  installRecipeSkills,
} from "../openclaw.js";
import { appendEvent } from "../activity.js";
import {
  guardInvalidRecipeId,
  guardOpenClaw,
  withErrorHandler,
  ID_RE,
  AGENT_NAME_RE,
} from "../middleware.js";

export function createRecipesRouter() {
  const router = Router();

  router.get("/", withErrorHandler(async (_req, res) => {
    if (await guardOpenClaw(res)) return;
    const recipes = await listRecipes();
    res.json(recipes);
  }, "GET /api/recipes"));

  router.get("/status", withErrorHandler(async (_req, res) => {
    if (await guardOpenClaw(res)) return;
    const status = recipeStatus();
    res.json(status);
  }, "GET /api/recipes/status"));

  router.get("/:id", withErrorHandler(async (req, res) => {
    const { id } = req.params;
    if (guardInvalidRecipeId(id, res)) return;
    if (await guardOpenClaw(res)) return;
    const md = await showRecipe(id);
    res.json({ md });
  }, "GET /api/recipes/:id"));

  router.get("/:id/status", withErrorHandler(async (req, res) => {
    const { id } = req.params;
    if (guardInvalidRecipeId(id, res)) return;
    if (await guardOpenClaw(res)) return;
    const statusList = recipeStatus(id);
    const item = Array.isArray(statusList) ? statusList[0] : statusList;
    if (!item) return res.status(404).json({ error: "Recipe not found" });
    res.json(item);
  }, "GET /api/recipes/:id/status"));

  router.post("/:id/scaffold-team", withErrorHandler(async (req, res) => {
    const { id: recipeId } = req.params;
    if (guardInvalidRecipeId(recipeId, res)) return;
    const { teamId, overwrite } = req.body || {};
    if (await guardOpenClaw(res)) return;
    if (!teamId || typeof teamId !== "string" || !teamId.trim()) {
      return res.status(400).json({ error: "Missing 'teamId'" });
    }
    const tid = teamId.trim();
    if (!tid.endsWith("-team")) {
      return res.status(400).json({ error: "teamId must end with -team" });
    }
    if (!ID_RE.test(tid)) {
      return res.status(400).json({ error: "Invalid teamId format" });
    }
    scaffoldTeam(recipeId, tid, { overwrite: !!overwrite });
    appendEvent({ type: "scaffold-team", teamId: tid, message: `Scaffolded team ${tid} from ${recipeId}` });
    res.json({ ok: true });
  }, "POST /api/recipes/:id/scaffold-team", 400));

  router.post("/:id/scaffold-agent", withErrorHandler(async (req, res) => {
    const { id: recipeId } = req.params;
    if (guardInvalidRecipeId(recipeId, res)) return;
    const { agentId, name, overwrite } = req.body || {};
    if (await guardOpenClaw(res)) return;
    if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
      return res.status(400).json({ error: "Missing 'agentId'" });
    }
    const aid = agentId.trim();
    if (!ID_RE.test(aid)) {
      return res.status(400).json({ error: "Invalid agentId format" });
    }
    let nameArg;
    if (name != null && typeof name === "string" && name.trim()) {
      const n = name.trim();
      if (n.length > 256) {
        return res.status(400).json({ error: "Agent name exceeds maximum length (256)" });
      }
      if (!AGENT_NAME_RE.test(n)) {
        return res.status(400).json({ error: "Agent name contains invalid characters" });
      }
      nameArg = n;
    }
    scaffoldAgent(recipeId, aid, { name: nameArg, overwrite: !!overwrite });
    appendEvent({ type: "scaffold-agent", message: `Scaffolded agent ${aid} from ${recipeId}` });
    res.json({ ok: true });
  }, "POST /api/recipes/:id/scaffold-agent", 400));

  router.post("/:id/install", withErrorHandler(async (req, res) => {
    const { id: recipeId } = req.params;
    if (guardInvalidRecipeId(recipeId, res)) return;
    const { scope = "global", teamId, agentId } = req.body || {};
    if (await guardOpenClaw(res)) return;
    if (!["global", "team", "agent"].includes(scope)) {
      return res.status(400).json({ error: "Invalid scope" });
    }
    if (scope === "team") {
      if (!teamId || !teamId.endsWith("-team")) {
        return res.status(400).json({ error: "teamId required and must end with -team for team scope" });
      }
      if (!ID_RE.test(teamId)) {
        return res.status(400).json({ error: "Invalid teamId format" });
      }
    }
    if (scope === "agent") {
      if (!agentId) {
        return res.status(400).json({ error: "agentId required for agent scope" });
      }
      if (!ID_RE.test(agentId)) {
        return res.status(400).json({ error: "Invalid agentId format" });
      }
    }
    const result = await installRecipeSkills(recipeId, { scope, teamId, agentId });
    if (result.installed?.length > 0) {
      appendEvent({ type: "install", message: `Installed skills for ${recipeId}: ${result.installed.join(", ")}` });
    }
    res.json(result);
  }, "POST /api/recipes/:id/install", 400));

  return router;
}
