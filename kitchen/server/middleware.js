/**
 * Shared guards, validation, and error-handling middleware.
 */
import { ID_RE, ITEM_ID_RE, AGENT_NAME_RE, getErrorStatus, formatError, DEMO_TEAM_ID } from "./validation.js";
import { checkOpenClaw } from "./openclaw.js";

const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];
const MATCH_ALLOWED_KEYS = new Set(["channel", "accountId", "guildId", "teamId", "peer"]);
const MAX_MATCH_VALUE_LENGTH = 1024;

export { formatError };

export function isDemoTeam(teamId) {
  return teamId === DEMO_TEAM_ID;
}

export function guardInvalidTeamId(teamId, res) {
  if (ID_RE.test(teamId)) return false;
  res.status(400).json({ error: "Invalid teamId format" });
  return true;
}

export function guardInvalidTicketId(ticketId, res) {
  if (ID_RE.test(ticketId)) return false;
  res.status(400).json({ error: "Invalid ticketId format" });
  return true;
}

export function guardInvalidItemId(itemId, res) {
  if (ITEM_ID_RE.test(itemId)) return false;
  res.status(400).json({ error: "Invalid itemId format" });
  return true;
}

export function guardInvalidRecipeId(recipeId, res) {
  if (ID_RE.test(recipeId)) return false;
  res.status(400).json({ error: "Invalid recipeId format" });
  return true;
}

export function guardDemoTeam(teamId, res) {
  if (isDemoTeam(teamId)) {
    res.status(400).json({ error: "Actions disabled in demo mode" });
    return true;
  }
  return false;
}

export async function guardOpenClaw(res) {
  const ok = await checkOpenClaw();
  if (!ok) {
    res.status(503).json({ error: "OpenClaw unavailable", openclaw: false });
    return true;
  }
  return false;
}

/**
 * Wrap async route handler with unified error handling.
 * @param {(req, res) => Promise<void>} fn
 * @param {string} logLabel - e.g. "GET /api/teams"
 * @param {number} [defaultStatus=502]
 */
export function withErrorHandler(fn, logLabel, defaultStatus = 502) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(`[kitchen] ${logLabel}:`, err);
      const status = defaultStatus === 502 ? getErrorStatus(err) : defaultStatus;
      res.status(status).json({ error: formatError(err) });
    }
  };
}

/**
 * Middleware: require valid teamId and ticketId, and reject demo-team for mutations.
 */
export function requireValidTicketRoute(req, res, next) {
  const { teamId, ticketId } = req.params;
  if (guardInvalidTeamId(teamId, res)) return;
  if (guardInvalidTicketId(ticketId, res)) return;
  if (guardDemoTeam(teamId, res)) return;
  next();
}

export function validateMatch(match, res) {
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

export { ID_RE, AGENT_NAME_RE };
