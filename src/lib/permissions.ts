// What is this file?   Small helper functions to decide what buttons to show.
// Why?                 Hide actions the user cannot do. The backend still checks
//   everything.
// Flutter/Dart idea:   helper functions like `bool can(Me? me, Permission p)`.
import type { Me, Permission, Role } from "./types";

/**
 * Check whether the logged-in user holds a permission.
 *
 * Why: lets the UI hide buttons the user could not use anyway. This is a
 * USABILITY feature only. The backend re-checks every request, so hiding a
 * button never replaces server-side authorization.
 *
 * @param me The /auth/me payload, or undefined while it is still loading.
 * @param permission The permission to test.
 * @returns True only when `me` is loaded and includes the permission.
 */
// Returns true if the permission is in the user's list. `me?.` is Dart's `me?.` (null-
//   safe). `?? false` is Dart's `?? false`.
export function can(me: Me | undefined, permission: Permission): boolean {
  return me?.permissions.includes(permission) ?? false;
}

/** Rank used to decide which roles a person may assign (mirrors the backend). */
// Dart: `const Map<Role,int>`. Same rule as the backend.
const ROLE_RANK: Record<Role, number> = { viewer: 1, agent: 2, admin: 3, owner: 4 };

/**
 * Roles the current user is allowed to grant or edit.
 *
 * Business rule (same as the backend's `can_manage_role_change`): you can
 * only handle roles at or below your own rank, so admins never see "owner".
 *
 * @param actorRole The current user's role.
 * @returns Roles to show in a role dropdown.
 */
// Roles you may give to others (not higher than your own).
export function assignableRoles(actorRole: Role): Role[] {
  return (Object.keys(ROLE_RANK) as Role[])
    .filter((role) => ROLE_RANK[role] <= ROLE_RANK[actorRole])
    .sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a]);
}

/**
 * Whether the current user may edit/remove a specific member.
 *
 * @param actorRole Role of the person looking at the table.
 * @param targetRole Role of the member in the row.
 * @returns True if the target's rank is not above the actor's.
 */
// True if you may edit or remove this row's member.
export function canManageMember(actorRole: Role, targetRole: Role): boolean {
  return ROLE_RANK[targetRole] <= ROLE_RANK[actorRole];
}
