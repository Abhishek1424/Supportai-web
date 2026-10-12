// Shows audit rows. Stateless widget idea. React escapes text, so `<script>` in a name is
//   shown as text, never run.
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";

/**
 * Render an entry's `details` object as short readable text.
 *
 * @param details Small JSON context stored with the entry (never secrets).
 * @returns e.g. "old_role: agent, new_role: admin", or "" when empty.
 */
// Turns a details Map into 'key: value, key: value' text.
export function summariseDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
}

/**
 * Table of audit entries.
 *
 * Presentational only. React escapes all text, so values such as an
 * organization name containing `<script>` are displayed as text, never run.
 *
 * @param props.entries Entries to show.
 * @returns The table or an empty-state message.
 */
// Table or an empty-state message.
export function AuditTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No audit entries found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Details</th>
            <th className="py-2">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap py-3 pr-4 text-slate-500">{formatDateTime(entry.created_at)}</td>
              <td className="py-3 pr-4 font-mono text-xs">{entry.action}</td>
              <td className="py-3 pr-4 text-slate-600">{summariseDetails(entry.details)}</td>
              <td className="py-3 text-slate-500">{entry.ip_address ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
