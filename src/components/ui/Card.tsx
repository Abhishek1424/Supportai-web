import type { ReactNode } from "react";

/**
 * White rounded container used to group related content.
 *
 * @param props.title Optional heading.
 * @param props.children Card body.
 * @returns A card.
 */
export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
      {title && <h2 className="mb-3 text-sm font-semibold text-slate-500">{title}</h2>}
      {children}
    </section>
  );
}
