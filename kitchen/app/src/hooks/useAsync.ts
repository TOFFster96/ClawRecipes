import { useState, useEffect, useCallback, useRef } from "react";

export type UseAsyncOptions<T> = {
  /** When fetcher throws, set data to this instead of leaving it null */
  fallbackOnError?: T;
  /** If false, skip the fetch (e.g. when a dependency is not ready) */
  enabled?: boolean;
  /** Refetch on this interval (ms). Useful for polling. */
  refetchInterval?: number;
};

/**
 * Async data fetcher hook with cancellation and retry.
 * @param fetcher - Async function that returns data (or null to skip/clear)
 * @param deps - Dependencies; refetches when they change
 * @param options - Optional fallbackOnError, enabled
 * @returns { data, loading, error, retry }
 */
export function useAsync<T>(
  fetcher: () => Promise<T | null>,
  deps: React.DependencyList,
  options: UseAsyncOptions<T> = {}
): { data: T | null; loading: boolean; error: string | null; retry: () => void } {
  const { fallbackOnError, enabled = true, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const prevDepsKeyRef = useRef<string>("");

  const retry = useCallback(() => {
    setRetryTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const depsKey = JSON.stringify(deps);
    const depsChanged = depsKey !== prevDepsKeyRef.current;
    prevDepsKeyRef.current = depsKey;
    if (depsChanged || data === null) setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          if (fallbackOnError !== undefined) {
            setData(fallbackOnError);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, retryTrigger, enabled]);

  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const id = setInterval(retry, refetchInterval);
    return () => clearInterval(id);
  }, [enabled, refetchInterval, retry]);

  return { data, loading, error, retry };
}
