"use client";

import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { capitalize, formatDateTime } from "@/lib/format";
import { assignableRoles, canManageMember } from "@/lib/permissions";
import type { Member, Role } from "@/lib/types";

interface MembersTableProps {
  members: Member[];
  /** Role of the person viewing the table. */
  actorRole: Role;
  /** Whether the viewer holds `members:manage` at all. */
  canManage: boolean;
  onRoleChange: (member: Member, role: Role) => void;
  onRemove: (member: Member) => void;
}

/**
 * Table of team members with inline role editing and removal.
 *
 * Display rules (mirroring the backend's rank rules so users don't hit
 * avoidable errors; the backend still enforces them):
 * - Without `members:manage`: roles are read-only badges, no actions.
 * - With it: a role dropdown and Remove button appear only for members whose
 *   rank is not above the viewer's.
 *
 * It is a "dumb" presentational component: it never calls the API itself;
 * the parent supplies the callbacks.
 *
 * @param props See MembersTableProps.
 * @returns The table, or an empty-state message.
 */
export function MembersTable({ members, actorRole, canManage, onRoleChange, onRemove }: MembersTableProps) {
  if (members.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No members match your search.</p>;
  }
  const roles = assignableRoles(actorRole);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Joined</th>
            {canManage && <th className="py-2 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((member) => {
            const editable = canManage && canManageMember(actorRole, member.role);
            return (
              <tr key={member.id}>
                <td className="py-3 pr-4">
                  <div className="font-medium">{member.full_name}</div>
                  <div className="text-slate-500">{member.email}</div>
                </td>
                <td className="py-3 pr-4">
                  {editable ? (
                    <select
                      aria-label={`Role for ${member.full_name}`}
                      value={member.role}
                      onChange={(e) => onRoleChange(member, e.target.value as Role)}
                      className="rounded-md border-0 py-1 text-sm ring-1 ring-slate-300"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {capitalize(r)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}
                </td>
                <td className="py-3 pr-4 text-slate-500">{formatDateTime(member.created_at)}</td>
                {canManage && (
                  <td className="py-3 text-right">
                    {editable && (
                      <Button variant="danger" onClick={() => onRemove(member)} aria-label={`Remove ${member.full_name}`}>
                        Remove
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
