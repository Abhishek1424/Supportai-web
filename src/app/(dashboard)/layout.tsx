import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Layout for every logged-in page (route group, so it adds no URL segment).
 *
 * @param props.children The page.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
