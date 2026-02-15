import { useEffect, useState, useRef } from "react";
import { fetchActivity, type ActivityEvent } from "../api";

const POLL_INTERVAL_MS = 5000;

export function ActivityFeed() {
  const [expanded, setExpanded] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchActivity(50)
        .then((data) => {
          if (cancelled) return;
          setEvents(data);

          const currentIds = new Set(data.map((e) => e.id));
          const prev = prevIdsRef.current;
          const newlyAdded = data.filter((e) => !prev.has(e.id));
          prevIdsRef.current = currentIds;

          if (newlyAdded.length > 0) {
            setNewIds(new Set(newlyAdded.map((e) => e.id)));
            setTimeout(() => setNewIds(new Set()), 1500);
          }
        })
        .catch(() => {});
    };

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <aside
      className="activity-feed activity-feed-aside d-flex flex-column flex-shrink-0"
      style={expanded ? { width: "260px" } : { width: "44px" }}
    >
      <button
        type="button"
        className="activity-feed-toggle border-0 d-flex align-items-center gap-1 text-start"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse activity feed" : "Expand activity feed"}
      >
        <span className="activity-feed-chevron" aria-hidden>
          {expanded ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          )}
        </span>
        {expanded && <span className="activity-feed-title">Activity</span>}
      </button>
      {expanded && (
      <div className="activity-list flex-grow-1 overflow-auto">
        {events.length === 0 && (
          <div className="p-4 text-muted text-center">No activity yet</div>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            className={`activity-item ${newIds.has(e.id) ? "activity-item-new" : ""}`}
          >
            <span className="activity-item-time">{formatTime(e.timestamp)}</span>
            <span className="activity-item-message">{e.message}</span>
          </div>
        ))}
      </div>
      )}
    </aside>
  );
}
