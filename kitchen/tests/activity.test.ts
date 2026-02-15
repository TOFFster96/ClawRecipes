import { describe, expect, test, beforeEach } from 'vitest';
import { appendEvent, getRecentEvents } from '../server/activity.js';

describe('activity', () => {
  beforeEach(() => {
    getRecentEvents(1);
  });

  test('appendEvent adds event with id, type, message, timestamp', () => {
    appendEvent({ type: 'move', teamId: 't1', ticketId: '001', message: 'Moved to done' });
    const events = getRecentEvents(10);
    expect(events.length).toBeGreaterThanOrEqual(1);
    const last = events[0];
    expect(last).toHaveProperty('id');
    expect(last).toHaveProperty('type', 'move');
    expect(last).toHaveProperty('teamId', 't1');
    expect(last).toHaveProperty('ticketId', '001');
    expect(last).toHaveProperty('message', 'Moved to done');
    expect(last).toHaveProperty('timestamp');
    expect(typeof last.timestamp).toBe('string');
    expect(last.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('getRecentEvents returns most recent first', () => {
    appendEvent({ type: 'a', message: 'First' });
    appendEvent({ type: 'b', message: 'Second' });
    appendEvent({ type: 'c', message: 'Third' });
    const events = getRecentEvents(10);
    expect(events[0].message).toBe('Third');
    expect(events[1].message).toBe('Second');
    expect(events[2].message).toBe('First');
  });

  test('getRecentEvents respects limit', () => {
    appendEvent({ type: 'x', message: 'One' });
    appendEvent({ type: 'x', message: 'Two' });
    appendEvent({ type: 'x', message: 'Three' });
    const events = getRecentEvents(2);
    expect(events.length).toBe(2);
  });

  test('getRecentEvents with limit 0 uses minimum 1', () => {
    appendEvent({ type: 'x', message: 'One' });
    const events = getRecentEvents(0);
    expect(events.length).toBeLessThanOrEqual(1);
  });

  test('getRecentEvents caps limit at MAX_EVENTS (200)', () => {
    appendEvent({ type: 'x', message: 'One' });
    const events = getRecentEvents(999);
    expect(events.length).toBeLessThanOrEqual(200);
  });

  test('appendEvent enforces ring buffer when exceeding MAX_EVENTS', () => {
    for (let i = 0; i < 205; i++) {
      appendEvent({ type: 'overflow', message: `Event ${i}` });
    }
    const events = getRecentEvents(250);
    expect(events.length).toBeLessThanOrEqual(200);
    expect(events[0].message).toBe('Event 204');
  });

  test('appendEvent truncates message exceeding MAX_MESSAGE_LENGTH', () => {
    const longMsg = 'x'.repeat(1500);
    appendEvent({ type: 'long', message: longMsg });
    const events = getRecentEvents(10);
    expect(events[0].message).toHaveLength(1027);
    expect(events[0].message.endsWith('...')).toBe(true);
    expect(events[0].message.startsWith('xxx')).toBe(true);
  });
});
