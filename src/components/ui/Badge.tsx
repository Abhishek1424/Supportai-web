import type { Role } from "@/lib/types";
import { capitalize } from "@/lib/format";

const ROLE_COLORS: Record<Role, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-indigo-100 text-indigo-700",
  agent: "bg-emerald-100 text-emerald-700",
  viewer: "bg-slate-100 text-slate-600",
};

/**
 * Small coloured pill showing a role.
 *
 * @param props.role The role to display.
 * @returns A badge.
 */
export function RoleBadge({ role }: { role: Role }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}>{capitalize(role)}</span>;
}
