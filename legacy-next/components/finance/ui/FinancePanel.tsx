import { ReactNode } from "react";

interface FinancePanelProps {
  children: ReactNode;
  className?: string;
}

export function FinancePanel({ children, className = "" }: FinancePanelProps) {
  return (
    <div className={`rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-b from-zinc-950 to-black p-5 shadow-[0_18px_54px_rgba(0,0,0,0.45)] ${className}`}>
      {children}
    </div>
  );
}
