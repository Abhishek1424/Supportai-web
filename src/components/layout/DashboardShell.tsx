"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { useLogout, useMe } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { Permission } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  /** Permission needed to see the link; undefined = visible to everyone. */
  permission?: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team", permission: "members:read" },
  { href: "/audit", label: "Audit log", permission: "audit:read" },
  { href: "/settings", label: "Settings", permission: "org:read" },
];

/**
 * Frame for all logged-in pages: sidebar navigation, header and sign-out.
 *
 * Flow: loads the profile (useMe). While loading it shows a placeholder; if
 * loading fails it shows the error (an expired session is redirected to
 * /login by the API client before we get here). Navigation links are filtered
 * by the user's permissions.
 *
 * @param props.children The current page content.
 * @returns The app shell.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me, isLoading, error } = useMe();
  const logout = useLogout();

  if (isLoading) return <p className="p-8 text-center text-sm text-slate-500">Loading…</p>;
  if (error || !me) {
    return (
      <div className="p-8">
        <Alert>{getErrorMessage(error)}</Alert>
      </div>
    );
  }

  /** Sign out, then go to the login page (cookies are cleared server-side). */
  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 text-xl font-bold text-indigo-600">SupportAI</div>
        <nav aria-label="Main" className="space-y-1">
          {NAV_ITEMS.filter((item) => !item.permission || can(me, item.permission)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === item.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-600">{me.organization.name}</div>
          <div className="flex items-center gap-3 text-sm">
            <span>{me.user.email}</span>
            <RoleBadge role={me.role} />
            <Button variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
