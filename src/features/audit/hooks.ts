"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AuditLogEntry, Page } from "@/lib/types";

/** Filters for the audit log list. */
export interface AuditParams {
  page: number;
  pageSize: number;
  action: string;
}

/**
 * Fetch one page of audit-log entries (newest first).
 *
 * The query key starts with "audit" so member mutations can invalidate it
 * (every team change creates a new entry).
 *
 * @param params Page, size and an optional exact action filter ("" = all).
 * @param enabled Pass false when the user lacks `audit:read`, so we don't make a call that is guaranteed to fail with 403.
 * @returns Query result whose `data` is Page<AuditLogEntry>.
 */
export function useAuditLogs(params: AuditParams, enabled = true) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () =>
      apiFetch<Page<AuditLogEntry>>("/audit-logs", {
        query: { page: params.page, page_size: params.pageSize, action: params.action },
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}
