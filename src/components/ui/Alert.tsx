import type { ReactNode } from "react";

/**
 * Inline message box for errors and confirmations.
 *
 * `role="alert"` makes screen readers announce errors immediately.
 *
 * @param props.tone "error" (red) or "success" (green).
 * @param props.children The message.
 * @returns A coloured message box.
 */
export function Alert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  const classes = tone === "error" ? "bg-red-50 text-red-700 ring-red-200" : "bg-green-50 text-green-700 ring-green-200";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md px-3 py-2 text-sm ring-1 ${classes}`}>
      {children}
    </div>
  );
}
