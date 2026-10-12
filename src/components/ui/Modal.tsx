// A dialog on top of the page. Flutter idea: `showDialog` + `AlertDialog`.
// It closes when the user presses Escape. "use client" = runs in the browser (it uses
//   effects).
"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Centered dialog with a dimmed backdrop.
 *
 * Behaviour: pressing Escape closes it; it is exposed to assistive technology
 * as a modal dialog labelled by its title.
 *
 * @param props.title Dialog heading (also its accessible name).
 * @param props.onClose Called when the user dismisses the dialog.
 * @param props.children Dialog content.
 * @returns The dialog markup.
 */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  // Runs after the component appears. The returned function runs when it disappears.
  // Flutter idea: add a listener in `initState`, remove it in `dispose`.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
