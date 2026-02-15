import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listTeams,
  getTickets,
  getTicketContent,
  listInbox,
  getInboxItemContent,
  listRecipes,
  showRecipe,
  recipeStatus,
  scaffoldTeam,
  scaffoldAgent,
  planCleanup,
  executeCleanup,
  installRecipeSkills,
  checkOpenClaw,
  moveTicket,
  assignTicket,
  takeTicket,
  handoffTicket,
  completeTicket,
  dispatch,
  listBindings,
  addBinding,
  removeBinding,
  removeTeam,
} from "./openclaw.js";
import {
  getDemoTickets,
  getDemoTicketContent,
  getDemoInbox,
  getDemoInboxItemContent,
} from "./demo-workspace.js";
import { appendEvent, getRecentEvents } from "./activity.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3456;
const TEAM_ID_RE = /^[a-zA-Z0-9_-]+$/;

function guardInvalidTeamId(teamId, res) {
  if (TEAM_ID_RE.test(teamId)) return false;
  res.status(400).json({ error: "Invalid teamId format" });
  return true;
}

function guardInvalidTicketId(ticketId, res) {
  if (TEAM_ID_RE.test(ticketId)) return false;
  res.status(400).json({ error: "Invalid ticketId format" });
  return true;
}

function guardInvalidItemId(itemId, res) {
  if (/^[a-zA-Z0-9_.-]+$/.test(itemId)) return false;
  res.status(400).json({ error: "Invalid itemId format" });
  return true;
}

function guardInvalidRecipeId(recipeId, res) {
  if (TEAM_ID_RE.test(recipeId)) return false;
  res.status(400).json({ error: "Invalid recipeId format" });
  return true;
}

const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];
const MATCH_ALLOWED_KEYS = new Set(["channel", "accountId", "guildId", "teamId", "peer"]);
const MAX_MATCH_VALUE_LENGTH = 1024;

function validateMatch(match, res) {
  if (!match || typeof match !== "object" || Array.isArray(match) || Object.getPrototypeOf(match) !== Object.prototype) {
    res.status(400).json({ error: "match must be a plain object" });
    return false;
  }
  for (const k of Object.keys(match)) {
    if (DANGEROUS_KEYS.includes(k)) {
      res.status(400).json({ error: "match contains disallowed key" });
      return false;
    }
    if (!MATCH_ALLOWED_KEYS.has(k)) {
      res.status(400).json({ error: "match contains unknown key" });
      return false;
    }
    const v = match[k];
    if (v != null && typeof v === "string" && v.length > MAX_MATCH_VALUE_LENGTH) {
      res.status(400).json({ error: `match.${k} value exceeds maximum length (1kb)` });
      return false;
    }
  }
  return true;
}

export function formatError(err) {
  const msg = String(err?.message ?? err);
  if (err?.code === "ETIMEDOUT" || msg.includes("ETIMEDOUT")) return "Operation timed out";
  if (process.env.NODE_ENV === "production") {
    if (msg.includes("ENOENT") || /open\s+['"][^'"]+['"]/.test(msg)) {
      return "File not found";
    }
  }
  return msg;
}

const isProd = process.env.NODE_ENV === "production";

/**
 * @param {{ production?: boolean }} [opts] - For tests: set production: true to simulate NODE_ENV=production
 */
export function createApp(opts = {}) {
  const prod = opts.production === true || isProd;
  const app = express();
  app.use(cors(prod ? { origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN || false } : {}));
  app.use(express.json({ limit: "256kb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (prod) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
      );
    }
    next();
  });

  if (prod) {
    app.use(
      rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        skip: (req) => req.path === "/api/health",
      })
    );
  }

  app.get("/api/health", async (_req, res) => {
  try {
    const openclaw = await checkOpenClaw();
    res.json({ ok: true, openclaw });
  } catch {
    res.status(503).json({ ok: false, openclaw: false });
  }
});

  app.get("/api/teams", async (_req, res) => {
  try {
    const teams = await listTeams();
    res.json(teams);
  } catch (err) {
    console.error("[kitchen] GET /api/teams:", err);
    res.status(500).json({ error: formatError(err) });
  }
});

  app.delete("/api/teams/:teamId", async (req, res) => {
  const { teamId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  if (teamId === "demo-team") {
    return res.status(400).json({ error: "Cannot remove demo team" });
  }
  if (prod && req.get("X-Confirm-Destructive") !== "true") {
    return res.status(403).json({ error: "Destructive operation requires X-Confirm-Destructive: true" });
  }
  if (await guardOpenClaw(res)) return;
  try {
    removeTeam(teamId);
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] DELETE /api/teams/:teamId:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.get("/api/teams/:teamId/tickets", async (req, res) => {
  const { teamId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  try {
    const data = teamId === "demo-team" ? await getDemoTickets() : await getTickets(teamId);
    res.json(data);
  } catch (err) {
    console.error("[kitchen] GET /api/teams/:teamId/tickets:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  app.get("/api/teams/:teamId/inbox", async (req, res) => {
  const { teamId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  try {
    const items =
      teamId === "demo-team" ? await getDemoInbox() : await listInbox(teamId);
    res.json(items.map(({ id, title, received }) => ({ id, title, received })));
  } catch (err) {
    console.error("[kitchen] GET /api/teams/:teamId/inbox:", err);
    res.status(err?.message?.includes("Invalid") ? 400 : 502).json({
      error: formatError(err),
    });
  }
});

  app.get("/api/teams/:teamId/inbox/:itemId/content", async (req, res) => {
  const { teamId, itemId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidItemId(itemId, res)) return;
  try {
    const content =
      teamId === "demo-team"
        ? await getDemoInboxItemContent(itemId)
        : await getInboxItemContent(teamId, itemId);
    if (content === null) {
      res.status(404).json({ error: "Inbox item not found" });
      return;
    }
    res.json({ content });
  } catch (err) {
    console.error("[kitchen] GET /api/teams/:teamId/inbox/:itemId/content:", err);
    res.status(err?.message?.includes("Invalid") ? 400 : 502).json({
      error: formatError(err),
    });
  }
});

  app.get("/api/teams/:teamId/tickets/:ticketId/content", async (req, res) => {
  const { teamId, ticketId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  try {
    const content =
      teamId === "demo-team"
        ? await getDemoTicketContent(ticketId)
        : await getTicketContent(teamId, ticketId);
    if (content === null) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json({ content });
  } catch (err) {
    console.error("[kitchen] GET /api/teams/:teamId/tickets/:ticketId/content:", err);
    res.status(err?.message?.includes("Invalid") ? 400 : 502).json({ error: formatError(err) });
  }
});

function guardDemoTeam(teamId, res) {
  if (teamId === "demo-team") {
    res.status(400).json({ error: "Actions disabled in demo mode" });
    return true;
  }
  return false;
}

  app.post("/api/teams/:teamId/tickets/:ticketId/move", (req, res) => {
  const { teamId, ticketId } = req.params;
  const { to, completed } = req.body || {};
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  if (!to) return res.status(400).json({ error: "Missing 'to' (stage)" });
  try {
    moveTicket(teamId, ticketId, to, { completed: !!completed });
    appendEvent({
      type: "move",
      teamId,
      ticketId,
      message: `Moved ticket ${ticketId} to ${to}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST move:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/teams/:teamId/tickets/:ticketId/assign", (req, res) => {
  const { teamId, ticketId } = req.params;
  const { owner } = req.body || {};
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  if (!owner) return res.status(400).json({ error: "Missing 'owner'" });
  try {
    assignTicket(teamId, ticketId, owner);
    appendEvent({
      type: "assign",
      teamId,
      ticketId,
      message: `Assigned ${ticketId} to ${owner}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST assign:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/teams/:teamId/tickets/:ticketId/take", (req, res) => {
  const { teamId, ticketId } = req.params;
  const { owner } = req.body || {};
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  if (!owner) return res.status(400).json({ error: "Missing 'owner'" });
  try {
    takeTicket(teamId, ticketId, owner);
    appendEvent({
      type: "take",
      teamId,
      ticketId,
      message: `${owner} took ticket ${ticketId}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST take:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/teams/:teamId/tickets/:ticketId/handoff", (req, res) => {
  const { teamId, ticketId } = req.params;
  const { tester } = req.body || {};
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  try {
    handoffTicket(teamId, ticketId, tester || "test");
    appendEvent({
      type: "handoff",
      teamId,
      ticketId,
      message: `Handed off ${ticketId} to ${tester || "test"}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST handoff:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/teams/:teamId/tickets/:ticketId/complete", (req, res) => {
  const { teamId, ticketId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  try {
    completeTicket(teamId, ticketId);
    appendEvent({
      type: "complete",
      teamId,
      ticketId,
      message: `Completed ticket ${ticketId}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST complete:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  async function guardOpenClaw(res) {
  const ok = await checkOpenClaw();
  if (!ok) {
    res.status(503).json({ error: "OpenClaw unavailable", openclaw: false });
    return true;
  }
  return false;
  }

  app.get("/api/recipes", async (_req, res) => {
  if (await guardOpenClaw(res)) return;
  try {
    const recipes = await listRecipes();
    res.json(recipes);
  } catch (err) {
    console.error("[kitchen] GET /api/recipes:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  app.get("/api/recipes/status", async (_req, res) => {
  if (await guardOpenClaw(res)) return;
  try {
    const status = recipeStatus();
    res.json(status);
  } catch (err) {
    console.error("[kitchen] GET /api/recipes/status:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  app.get("/api/recipes/:id", async (req, res) => {
  const { id } = req.params;
  if (guardInvalidRecipeId(id, res)) return;
  if (await guardOpenClaw(res)) return;
  try {
    const md = await showRecipe(id);
    res.json({ md });
  } catch (err) {
    console.error("[kitchen] GET /api/recipes/:id:", err);
    res.status(err?.message?.includes("Invalid") ? 400 : 502).json({
      error: formatError(err),
    });
  }
});

  app.get("/api/recipes/:id/status", async (req, res) => {
  const { id } = req.params;
  if (guardInvalidRecipeId(id, res)) return;
  if (await guardOpenClaw(res)) return;
  try {
    const statusList = recipeStatus(id);
    const item = Array.isArray(statusList) ? statusList[0] : statusList;
    if (!item) return res.status(404).json({ error: "Recipe not found" });
    res.json(item);
  } catch (err) {
    console.error("[kitchen] GET /api/recipes/:id/status:", err);
    res.status(err?.message?.includes("Invalid") ? 400 : 502).json({
      error: formatError(err),
    });
  }
});

  app.post("/api/recipes/:id/scaffold-team", async (req, res) => {
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
  if (!TEAM_ID_RE.test(tid)) {
    return res.status(400).json({ error: "Invalid teamId format" });
  }
  try {
    scaffoldTeam(recipeId, tid, { overwrite: !!overwrite });
    appendEvent({
      type: "scaffold-team",
      teamId: tid,
      message: `Scaffolded team ${tid} from ${recipeId}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST /api/recipes/:id/scaffold-team:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/recipes/:id/scaffold-agent", async (req, res) => {
  const { id: recipeId } = req.params;
  if (guardInvalidRecipeId(recipeId, res)) return;
  const { agentId, name, overwrite } = req.body || {};
  if (await guardOpenClaw(res)) return;
  if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
    return res.status(400).json({ error: "Missing 'agentId'" });
  }
  const aid = agentId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(aid)) {
    return res.status(400).json({ error: "Invalid agentId format" });
  }
  let nameArg;
  if (name != null && typeof name === "string" && name.trim()) {
    const n = name.trim();
    if (n.length > 256) {
      return res.status(400).json({ error: "Agent name exceeds maximum length (256)" });
    }
    if (!/^[\w\s.-]+$/.test(n)) {
      return res.status(400).json({ error: "Agent name contains invalid characters" });
    }
    nameArg = n;
  }
  try {
    scaffoldAgent(recipeId, aid, { name: nameArg, overwrite: !!overwrite });
    appendEvent({
      type: "scaffold-agent",
      message: `Scaffolded agent ${aid} from ${recipeId}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST /api/recipes/:id/scaffold-agent:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.get("/api/bindings", async (_req, res) => {
  if (await guardOpenClaw(res)) return;
  try {
    const bindings = listBindings();
    res.json(bindings);
  } catch (err) {
    console.error("[kitchen] GET /api/bindings:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  app.post("/api/bindings", async (req, res) => {
  if (await guardOpenClaw(res)) return;
  const { agentId, match } = req.body || {};
  if (!agentId || !match?.channel) {
    return res.status(400).json({ error: "Missing agentId or match.channel" });
  }
  if (!validateMatch(match, res)) return;
  if (!TEAM_ID_RE.test(agentId)) {
    return res.status(400).json({ error: "Invalid agentId format" });
  }
  try {
    addBinding({ agentId, match });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST /api/bindings:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.delete("/api/bindings", async (req, res) => {
  if (await guardOpenClaw(res)) return;
  const { agentId, match } = req.body || {};
  if (!match?.channel) {
    return res.status(400).json({ error: "Missing match.channel" });
  }
  if (!validateMatch(match, res)) return;
  if (agentId && !TEAM_ID_RE.test(agentId)) {
    return res.status(400).json({ error: "Invalid agentId format" });
  }
  try {
    removeBinding({ agentId, match });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] DELETE /api/bindings:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.post("/api/teams/:teamId/dispatch", (req, res) => {
  const { teamId } = req.params;
  const { request, owner } = req.body || {};
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  if (!request || typeof request !== "string" || !request.trim()) {
    return res.status(400).json({ error: "Missing or invalid 'request'" });
  }
  const trimmed = request.trim();
  if (trimmed.length > 65536) {
    return res.status(400).json({ error: "Request string exceeds maximum length (64kb)" });
  }
  try {
    dispatch(teamId, trimmed, owner || "dev");
    appendEvent({
      type: "dispatch",
      teamId,
      message: `Dispatched request to ${teamId}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[kitchen] POST dispatch:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.get("/api/activity", (req, res) => {
  const raw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(1, raw), 200) : 50;
  try {
    const events = getRecentEvents(limit);
    res.json(events);
  } catch (err) {
    console.error("[kitchen] GET /api/activity:", err);
    res.status(500).json({ error: formatError(err) });
  }
});

  app.post("/api/recipes/:id/install", async (req, res) => {
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
    if (!TEAM_ID_RE.test(teamId)) {
      return res.status(400).json({ error: "Invalid teamId format" });
    }
  }
  if (scope === "agent") {
    if (!agentId) {
      return res.status(400).json({ error: "agentId required for agent scope" });
    }
    if (!TEAM_ID_RE.test(agentId)) {
      return res.status(400).json({ error: "Invalid agentId format" });
    }
  }
  try {
    const result = await installRecipeSkills(recipeId, { scope, teamId, agentId });
    if (result.installed?.length > 0) {
      appendEvent({
        type: "install",
        message: `Installed skills for ${recipeId}: ${result.installed.join(", ")}`,
      });
    }
    res.json(result);
  } catch (err) {
    console.error("[kitchen] POST /api/recipes/:id/install:", err);
    res.status(400).json({ error: formatError(err) });
  }
});

  app.get("/api/cleanup/plan", async (_req, res) => {
  if (await guardOpenClaw(res)) return;
  try {
    const plan = await planCleanup();
    res.json(plan);
  } catch (err) {
    console.error("[kitchen] GET /api/cleanup/plan:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  app.post("/api/cleanup/execute", async (req, res) => {
  if (prod && req.get("X-Confirm-Destructive") !== "true") {
    return res.status(403).json({ error: "Destructive operation requires X-Confirm-Destructive: true" });
  }
  if (await guardOpenClaw(res)) return;
  try {
    const result = await executeCleanup();
    res.json(result);
  } catch (err) {
    console.error("[kitchen] POST /api/cleanup/execute:", err);
    res.status(502).json({ error: formatError(err) });
  }
});

  const appDist = join(__dirname, "..", "app", "dist");
  const distExists = existsSync(appDist);

  if (distExists) {
    app.use(express.static(appDist));
  }

  app.get("*", (req, res, next) => {
    if (!distExists) {
      res.status(503).type("html").send(
        `<!DOCTYPE html><html><head><title>Kitchen</title></head><body>` +
          `<p>Kitchen frontend not built.</p>` +
          `<p>Run: <code>cd kitchen && npm run build</code></p>` +
          `</body></html>`
      );
      return;
    }
    res.sendFile(join(appDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });

  app.use((err, _req, res, _next) => {
    console.error("[kitchen] Unhandled error:", err);
    res.status(500).json({ error: formatError(err) });
  });

  return app;
}

const app = createApp();
if (!process.env.VITEST) {
  const server = app.listen(PORT, () => {
    console.log(`[kitchen] Server running at http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[kitchen] Port ${PORT} is in use. Stop the process (e.g. kill $(lsof -t -i:${PORT})) or run with PORT=<other>`
    );
    process.exit(1);
  }
  throw err;
  });
}
