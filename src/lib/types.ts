/**
 * TypeScript mirrors of the backend's JSON contracts.
 *
 * Why: one place where the frontend states what the API returns, so a backend
 * change shows up as a compile error here instead of a runtime surprise.
 * Keep these in sync with the Pydantic schemas in the backend
 * (`app/modules/*\/schemas.py`).
 */

/** Roles a member can hold in an organization (see backend rbac/constants.py). */
export type Role = "owner" | "admin" | "agent" | "viewer";

/** Every role, ordered from most to least powerful (used to build dropdowns). */
export const ROLES: readonly Role[] = ["owner", "admin", "agent", "viewer"];

/** Fine-grained permissions the backend grants to roles. */
export type Permission =
  | "org:read"
  | "org:update"
  | "members:read"
  | "members:manage"
  | "audit:read";

/** The logged-in user. The password hash never reaches the frontend. */
export interface User {
  id: string;
  email: string;
  full_name: string;
}

/** A tenant (client company). */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/** Response of GET /auth/me: who am I, where, and what may I do. */
export interface Me {
  user: User;
  organization: Organization;
  role: Role;
  permissions: Permission[];
}

/** One person in the organization's team. */
export interface Member {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

/** One audit-log entry. */
export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

/** The backend's standard list envelope. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/** Sortable member columns (must match the backend allow-list). */
export type MemberSortBy = "created_at" | "email" | "full_name" | "role";

/** Query options for the member list. */
export interface MemberListParams {
  page: number;
  pageSize: number;
  q: string;
  sortBy: MemberSortBy;
  sortOrder: "asc" | "desc";
}

/** Body for adding a member. `fullName`/`password` are only needed for brand-new users. */
export interface AddMemberInput {
  email: string;
  role: Role;
  full_name?: string;
  password?: string;
}
