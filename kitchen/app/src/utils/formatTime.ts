const SEC_PER_MIN = 60;
const SEC_PER_HOUR = 3600;
const SEC_PER_DAY = 86400;

/** Format a timestamp as relative time ("just now", "5m ago", "2h ago") or locale date. */
export function formatRelativeTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < SEC_PER_MIN) return "just now";
  if (diff < SEC_PER_HOUR) return `${Math.floor(diff / SEC_PER_MIN)}m ago`;
  if (diff < SEC_PER_DAY) return `${Math.floor(diff / SEC_PER_HOUR)}h ago`;
  return d.toLocaleDateString();
}
