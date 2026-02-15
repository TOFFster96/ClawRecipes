/**
 * Shared validation regexes and helpers.
 */

/** Demo team ID used when Kitchen runs without OpenClaw */
export const DEMO_TEAM_ID = "demo-team";

/** IDs for team, ticket, recipe, agent: alphanumeric, underscore, hyphen */
export const ID_RE = /^[a-zA-Z0-9_-]+$/;

/** Item IDs (inbox, etc.): also allows dot */
export const ITEM_ID_RE = /^[a-zA-Z0-9_.-]+$/;

/** Agent name: word chars, spaces, dot, hyphen */
export const AGENT_NAME_RE = /^[\w\s.-]+$/;

/**
 * Determine HTTP status for an error.
 * @param {Error} err
 * @returns {number} 400 for validation/client errors, 502 for upstream/CLI
 */
export function getErrorStatus(err) {
  const msg = String(err?.message ?? err);
  if (msg.includes("Invalid") || msg.includes("Missing") || msg.includes("required")) {
    return 400;
  }
  return 502;
}

/**
 * Sanitize error message for client response.
 * @param {unknown} err
 * @returns {string}
 */
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
