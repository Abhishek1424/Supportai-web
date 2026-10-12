// Layout for public pages (login, register): a centered white card.
// `(auth)` in the folder name is a "route group": it shares a layout but does NOT add to
//   the URL.
// Flutter idea: a parent `Scaffold` used by several screens.
import type { ReactNode } from "react";

/**
 * Shared frame for the public auth pages: a centered card on a plain background.
 *
 * @param props.children The login or register form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-1 text-2xl font-bold text-indigo-600">SupportAI</h1>
        {children}
      </div>
    </main>
  );
}
