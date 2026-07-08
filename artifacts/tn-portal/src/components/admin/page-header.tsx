import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 border-b-4 border-stone-800 pb-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase font-serif">
          {title}
        </h1>
        {description && (
          <p className="text-stone-600 text-sm mt-1 font-medium tracking-wide uppercase">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
