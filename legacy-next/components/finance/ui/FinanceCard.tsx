import { ReactNode } from "react";
import { FinanceIcon } from "./FinanceIcon";
import { FinancePanel } from "./FinancePanel";

interface FinanceCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function FinanceCard({ title, icon = "FN", children, footer }: FinanceCardProps) {
  return (
    <FinancePanel className="group transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/50">
      <div className="mb-4 flex items-center gap-3">
        <FinanceIcon label={icon} />
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      </div>
      <div className="text-sm leading-6 text-zinc-300">{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </FinancePanel>
  );
}
