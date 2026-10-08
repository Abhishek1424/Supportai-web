import { useEffect, useState } from "react";

/**
 * Delay propagating a fast-changing value (e.g. what the user types).
 *
 * Why: without it, every keystroke in a search box would trigger an API call.
 *
 * @param value The live value.
 * @param delayMs How long the value must stay unchanged before it is returned.
 * @returns The value, updated only after `delayMs` of quiet.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
