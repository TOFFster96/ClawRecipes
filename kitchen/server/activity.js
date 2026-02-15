/**
 * In-memory activity feed. Events are appended on successful actions.
 * Bounded ring buffer (200 events).
 */

const MAX_EVENTS = 200;

/** @type {Array<{ id: string; type: string; teamId?: string; ticketId?: string; message: string; timestamp: string }>} */
const events = [];
let nextId = 1;

/**
 * Append an event to the feed.
 * @param {{ type: string; teamId?: string; ticketId?: string; message: string }} opts
 */
export function appendEvent(opts) {
  const { type, teamId, ticketId, message } = opts;
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
  const n = Math.min(Math.max(1, limit), MAX_EVENTS);
  return [...events].reverse().slice(0, n);
}
