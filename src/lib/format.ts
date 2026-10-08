/**
 * Format an ISO timestamp from the API for display in the user's locale.
 *
 * @param iso ISO-8601 date string (UTC) from the backend.
 * @returns e.g. "Oct 8, 2026, 1:29 PM"; the original string if it is not a valid date.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Capitalise the first letter ("owner" -> "Owner").
 *
 * @param text Any word.
 * @returns The word with an upper-case first letter.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
