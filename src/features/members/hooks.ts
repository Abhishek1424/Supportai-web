// Hooks for the team list and team changes.
// Flutter idea: a MembersRepository + providers. `useMembers` reads. The others write.
// Data flow: TeamView -> useMembers -> apiFetch -> proxy -> FastAPI -> Page<Member> ->
//   table.
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AddMemberInput, Member, MemberListParams, Page, Role } from "@/lib/types";

/** Cache key prefix for member lists (used to invalidate all pages/filters at once). */
// Cache key prefix. After a change we mark everything with this prefix as old.
export const MEMBERS_KEY = ["members"] as const;

/**
 * Fetch one page of team members.
 *
 * Maps the camelCase UI params onto the backend's snake_case query string.
 * `keepPreviousData` keeps the old rows visible while the next page loads, so
 * the table doesn't flash empty when searching or paging.
 *
 * @param params Page, size, search text and sorting.
 * @returns Query result whose `data` is the Page<Member>.
 */
// Reads one page. The cache key includes `params`, so each page/search has its own saved
//   result. `keepPreviousData` keeps old rows on screen while new ones load.
export function useMembers(params: MemberListParams) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, params],
    queryFn: () =>
      apiFetch<Page<Member>>("/organizations/current/members", {
        query: {
          page: params.page,
          page_size: params.pageSize,
          q: params.q,
          sort_by: params.sortBy,
          sort_order: params.sortOrder,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

/**
 * Build a mutation that changes team data and then refreshes related caches.
 *
 * Why shared: add / change-role / remove all need the same follow-up: reload
 * the member lists, and the audit log (each action creates an audit entry).
 *
 * @param fn The API call to perform.
 * @returns A configured mutation.
 */
// Shared helper. After add / role change / remove, it refreshes the member list and the
//   audit log (`invalidateQueries` = 'this data is old, load it again').
function useMemberMutation<TInput, TResult>(fn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

/**
 * Mutation: add a person to the organization.
 *
 * @returns Mutation taking an AddMemberInput.
 */
// POST a new member.
export function useAddMember() {
  return useMemberMutation((input: AddMemberInput) =>
    apiFetch<Member>("/organizations/current/members", { method: "POST", body: input }),
  );
}

/**
 * Mutation: change a member's role.
 *
 * @returns Mutation taking `{ memberId, role }`.
 */
// PATCH a member's role.
export function useChangeRole() {
  return useMemberMutation(({ memberId, role }: { memberId: string; role: Role }) =>
    apiFetch<Member>(`/organizations/current/members/${memberId}`, { method: "PATCH", body: { role } }),
  );
}

/**
 * Mutation: remove a member from the organization.
 *
 * @returns Mutation taking the member id.
 */
// DELETE a member.
export function useRemoveMember() {
  return useMemberMutation((memberId: string) =>
    apiFetch<void>(`/organizations/current/members/${memberId}`, { method: "DELETE" }),
  );
}
