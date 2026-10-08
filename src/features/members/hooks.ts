"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AddMemberInput, Member, MemberListParams, Page, Role } from "@/lib/types";

/** Cache key prefix for member lists (used to invalidate all pages/filters at once). */
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
export function useRemoveMember() {
  return useMemberMutation((memberId: string) =>
    apiFetch<void>(`/organizations/current/members/${memberId}`, { method: "DELETE" }),
  );
}
