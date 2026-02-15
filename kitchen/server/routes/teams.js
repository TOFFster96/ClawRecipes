import { Router } from "express";
import {
  listTeams,
  getTickets,
  getTicketContent,
  listInbox,
  getInboxItemContent,
  moveTicket,
  assignTicket,
  takeTicket,
  handoffTicket,
  completeTicket,
  dispatch,
  removeTeam,
} from "../openclaw.js";
import {
  getDemoTickets,
  getDemoTicketContent,
  getDemoInbox,
  getDemoInboxItemContent,
} from "../demo-workspace.js";
import { appendEvent } from "../activity.js";
import {
  guardInvalidTeamId,
  guardInvalidItemId,
  guardInvalidTicketId,
  guardDemoTeam,
  guardOpenClaw,
  isDemoTeam,
  requireValidTicketRoute,
  withErrorHandler,
} from "../middleware.js";

const DISPATCH_MAX_LENGTH = 65536;

/**
 * @param {boolean} prod - Production mode (enforces X-Confirm-Destructive for delete)
 */
export function createTeamsRouter(prod) {
  const router = Router();

  router.get("/", withErrorHandler(async (_req, res) => {
    const teams = await listTeams();
    res.json(teams);
  }, "GET /api/teams", 500));

  router.delete("/:teamId", withErrorHandler(async (req, res) => {
    const { teamId } = req.params;
    if (guardInvalidTeamId(teamId, res)) return;
    if (isDemoTeam(teamId)) {
      return res.status(400).json({ error: "Cannot remove demo team" });
    }
    if (prod && req.get("X-Confirm-Destructive") !== "true") {
      return res.status(403).json({ error: "Destructive operation requires X-Confirm-Destructive: true" });
    }
    if (await guardOpenClaw(res)) return;
    removeTeam(teamId);
    res.json({ ok: true });
  }, "DELETE /api/teams/:teamId", 400));

  router.get("/:teamId/tickets", withErrorHandler(async (req, res) => {
    const { teamId } = req.params;
    if (guardInvalidTeamId(teamId, res)) return;
    const data = isDemoTeam(teamId) ? await getDemoTickets() : await getTickets(teamId);
    res.json(data);
  }, "GET /api/teams/:teamId/tickets"));

  router.get("/:teamId/inbox", withErrorHandler(async (req, res) => {
    const { teamId } = req.params;
    if (guardInvalidTeamId(teamId, res)) return;
    const items = isDemoTeam(teamId) ? await getDemoInbox() : await listInbox(teamId);
    res.json(items.map(({ id, title, received }) => ({ id, title, received })));
  }, "GET /api/teams/:teamId/inbox"));

  router.get("/:teamId/inbox/:itemId/content", withErrorHandler(async (req, res) => {
    const { teamId, itemId } = req.params;
    if (guardInvalidTeamId(teamId, res)) return;
    if (guardInvalidItemId(itemId, res)) return;
    const content =
      isDemoTeam(teamId)
        ? await getDemoInboxItemContent(itemId)
        : await getInboxItemContent(teamId, itemId);
    if (content === null) {
      res.status(404).json({ error: "Inbox item not found" });
      return;
    }
    res.json({ content });
  }, "GET /api/teams/:teamId/inbox/:itemId/content"));

  router.get("/:teamId/tickets/:ticketId/content", withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    if (guardInvalidTeamId(teamId, res)) return;
    if (guardInvalidTicketId(ticketId, res)) return;
    const content =
      isDemoTeam(teamId)
        ? await getDemoTicketContent(ticketId)
        : await getTicketContent(teamId, ticketId);
    if (content === null) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json({ content });
  }, "GET /api/teams/:teamId/tickets/:ticketId/content"));

  router.post("/:teamId/tickets/:ticketId/move", requireValidTicketRoute, withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    const { to, completed } = req.body || {};
    if (!to) return res.status(400).json({ error: "Missing 'to' (stage)" });
    moveTicket(teamId, ticketId, to, { completed: !!completed });
    appendEvent({ type: "move", teamId, ticketId, message: `Moved ticket ${ticketId} to ${to}` });
    res.json({ ok: true });
  }, "POST move", 400));

  router.post("/:teamId/tickets/:ticketId/assign", requireValidTicketRoute, withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    const { owner } = req.body || {};
    if (!owner) return res.status(400).json({ error: "Missing 'owner'" });
    assignTicket(teamId, ticketId, owner);
    appendEvent({ type: "assign", teamId, ticketId, message: `Assigned ${ticketId} to ${owner}` });
    res.json({ ok: true });
  }, "POST assign", 400));

  router.post("/:teamId/tickets/:ticketId/take", requireValidTicketRoute, withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    const { owner } = req.body || {};
    if (!owner) return res.status(400).json({ error: "Missing 'owner'" });
    takeTicket(teamId, ticketId, owner);
    appendEvent({ type: "take", teamId, ticketId, message: `${owner} took ticket ${ticketId}` });
    res.json({ ok: true });
  }, "POST take", 400));

  router.post("/:teamId/tickets/:ticketId/handoff", requireValidTicketRoute, withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    const { tester } = req.body || {};
    handoffTicket(teamId, ticketId, tester || "test");
    appendEvent({ type: "handoff", teamId, ticketId, message: `Handed off ${ticketId} to ${tester || "test"}` });
    res.json({ ok: true });
  }, "POST handoff", 400));

  router.post("/:teamId/tickets/:ticketId/complete", requireValidTicketRoute, withErrorHandler(async (req, res) => {
    const { teamId, ticketId } = req.params;
    completeTicket(teamId, ticketId);
    appendEvent({ type: "complete", teamId, ticketId, message: `Completed ticket ${ticketId}` });
    res.json({ ok: true });
  }, "POST complete", 400));

  router.post("/:teamId/dispatch", withErrorHandler(async (req, res) => {
    const { teamId } = req.params;
    const { request, owner } = req.body || {};
    if (guardInvalidTeamId(teamId, res)) return;
    if (guardDemoTeam(teamId, res)) return;
    if (!request || typeof request !== "string" || !request.trim()) {
      return res.status(400).json({ error: "Missing or invalid 'request'" });
    }
    const trimmed = request.trim();
    if (trimmed.length > DISPATCH_MAX_LENGTH) {
      return res.status(400).json({ error: "Request string exceeds maximum length (64kb)" });
    }
    dispatch(teamId, trimmed, owner || "dev");
    appendEvent({ type: "dispatch", teamId, message: `Dispatched request to ${teamId}` });
    res.json({ ok: true });
  }, "POST dispatch", 400));

  return router;
}
