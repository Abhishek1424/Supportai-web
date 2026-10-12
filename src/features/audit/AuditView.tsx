// The Audit log screen: filter dropdown + table + pager. Only owners/admins can open it.
//   Same structure as TeamView.
"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { useMe } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/api";
import { can } from "@/lib/permissions";
import { AuditTable } from "./AuditTable";
import { useAuditLogs } from "./hooks";

const PAGE_SIZE = 15;

/** Actions the backend records, for the filter dropdown (see backend audit/constants.py). */
// Action names for the dropdown. They must match the backend's audit constants.
const ACTION_FILTERS = [
  "organization.created",
  "organization.updated",
  "member.added",
  "member.role_changed",
  "member.removed",
  "auth.login",
  "auth.refresh_token_reuse_detected",
];

/**
 * The Audit log screen.
 *
 * Only owners/admins hold `audit:read`. Others see an explanation instead of
 * a failing request. Filtering by action resets to page 1.
 *
 * @returns The audit log UI.
 */
// Screen widget. Shows a message if the user lacks `audit:read`.
export function AuditView() {
  const { data: me } = useMe();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const allowed = can(me, "audit:read");
  const logs = useAuditLogs({ page, pageSize: PAGE_SIZE, action }, allowed);

  if (!me) return null;
  if (!allowed) {
    return <Alert>You do not have permission to view the audit log.</Alert>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Audit log</h1>
      <Card>
        <div className="mb-4 max-w-xs">
          <SelectField
            label="Filter by action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {ACTION_FILTERS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </SelectField>
        </div>
        {logs.isError && <Alert>{getErrorMessage(logs.error)}</Alert>}
        {logs.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>}
        {logs.data && (
          <>
            <AuditTable entries={logs.data.items} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={logs.data.total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
