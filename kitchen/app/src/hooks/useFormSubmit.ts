import { useCallback, useState } from "react";

/**
 * Hook for form submission with loading and error state.
 * Wraps an async submit function with standardized loading/error handling.
 */
export function useFormSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setError(null);
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, setError, submit, clearError };
}
