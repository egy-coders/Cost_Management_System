import { ReactNode } from "react";
import clsx from "clsx";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-lg border border-gray-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
