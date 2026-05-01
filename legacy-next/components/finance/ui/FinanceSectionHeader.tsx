import { ReactNode } from "react";

interface FinanceSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function FinanceSectionHeader({ title, subtitle, action }: FinanceSectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
