import { useEffect, useState } from "react";

/**
 * Returns a value that updates only after `delayMs` of no further updates.
 * Use this to throttle API calls in response to user input.
 *
 * Example:
 *   const [query, setQuery] = useState("");
 *   const debouncedQuery = useDebounce(query, 300);
 *   useEffect(() => { search(debouncedQuery) }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}