// A custom hook = a reusable function with state inside. Names start with `use`.
// Flutter idea: a small helper that holds a Timer, like a debounce for a search TextField.
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
// Returns the value only after the user stops changing it for `delayMs`. Stops an API call
//   on every key press.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  // Start a timer when `value` changes. Cleanup cancels the old timer (like
  //   `timer.cancel()` in dispose).
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
