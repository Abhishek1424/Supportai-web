"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { ME_KEY } from "@/features/auth/hooks";
import type { Organization } from "@/lib/types";

/**
 * Mutation: rename the current organization.
 *
 * After success the cached profile (/auth/me, which contains the org name
 * shown in the header) and the audit log are refreshed.
 *
 * @returns Mutation taking the new name.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Organization>("/organizations/current", { method: "PATCH", body: { name } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ME_KEY });
      void queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
