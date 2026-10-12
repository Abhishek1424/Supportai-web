// The home screen: company name, my role, team size, recent activity.
// Team size trick: ask for a page of size 1 and read `total` (no need to download
//   everyone).
"use client";

import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/ui/Badge";
import { useAuditLogs } from "@/features/audit/hooks";
import { AuditTable } from "@/features/audit/AuditTable";
import { useMe } from "@/features/auth/hooks";
import { useMembers } from "@/features/members/hooks";
import { can } from "@/lib/permissions";

/**
 * The dashboard home: workspace summary and recent activity.
 *
 * Team size comes from asking for a page of size 1 and reading `total`, so we
 * don't download every member just to count them. The recent-activity card is
 * only requested for users who hold `audit:read`.
 *
 * @returns The overview UI.
 */
// Screen widget. It uses three hooks, like three providers read in one `build`.
export function DashboardView() {
  const { data: me } = useMe();
  const members = useMembers({ page: 1, pageSize: 1, q: "", sortBy: "created_at", sortOrder: "asc" });
  const canSeeAudit = can(me, "audit:read");
  const recent = useAuditLogs({ page: 1, pageSize: 5, action: "" }, canSeeAudit);

  if (!me) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Welcome back, {me.user.full_name}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Organization">
          <p className="text-lg font-semibold">{me.organization.name}</p>
        </Card>
        <Card title="Your role">
          <RoleBadge role={me.role} />
        </Card>
        <Card title="Team size">
          <p className="text-lg font-semibold">{members.data?.total ?? "-"}</p>
        </Card>
      </div>
      {canSeeAudit && (
        <Card title="Recent activity">
          {recent.data ? <AuditTable entries={recent.data.items} /> : <p className="text-sm text-slate-500">Loading…</p>}
        </Card>
      )}
    </div>
  );
}
