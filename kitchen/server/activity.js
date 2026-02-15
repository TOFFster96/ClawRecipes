/**
 * In-memory activity feed. Events are appended on successful actions.
 * Bounded ring buffer (200 events).
 */

export const MAX_EVENTS = 200;
const MAX_MESSAGE_LENGTH = 1024;

/** @type {Array<{ id: string; type: string; teamId?: string; ticketId?: string; message: string; timestamp: string }>} */
const events = [];
let nextId = 1;

/**
 * Append an event to the feed.
 * @param {{ type: string; teamId?: string; ticketId?: string; message: string }} opts
 */
export function appendEvent(opts) {
  let { type, teamId, ticketId, message } = opts;
  if (typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
    message = message.slice(0, MAX_MESSAGE_LENGTH) + "...";
  }
  const id = String(nextId++);
  const timestamp = new Date().toISOString();
  const event = { id, type, teamId, ticketId, message, timestamp };
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.shift();
  }
}

/**
 * Get recent events, most recent first.
 * @param {number} [limit=50]
 * @returns {Array<{ id: string; type: string; teamId?: string; ticketId?: string; message: string; timestamp: string }>}
 */
export function getRecentEvents(limit = 50) {
  const safe = Number.isFinite(limit) ? limit : 50;
  const n = Math.min(Math.max(1, safe), MAX_EVENTS);
  return [...events].reverse().slice(0, n);
}
