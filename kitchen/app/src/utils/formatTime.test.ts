import { describe, expect, test } from "vitest";
import { formatRelativeTime } from "./formatTime";

describe("formatRelativeTime", () => {
  test('returns "just now" for recent timestamps', () => {
    const now = new Date();
    const ts = new Date(now.getTime() - 5000).toISOString();
    expect(formatRelativeTime(ts)).toBe("just now");
  });

  test('returns "Xm ago" for events within an hour', () => {
    const now = new Date();
    const ts = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("5m ago");
  });

  test('returns "Xh ago" for events within a day', () => {
    const now = new Date();
    const ts = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("2h ago");
  });

  test("returns locale date for events older than a day", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 3600 * 1000);
    const ts = yesterday.toISOString();
    expect(formatRelativeTime(ts)).toBe(yesterday.toLocaleDateString());
  });
});
