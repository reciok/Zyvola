import { ReactNode } from "react";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { FinancePanel } from "@/components/finance/ui/FinancePanel";

interface FinanceShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function FinanceShell({ title, subtitle, children }: FinanceShellProps) {
  return (
    <section className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <FinancePanel className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">Finance Hub</p>
          <FinanceSectionHeader title={title} subtitle={subtitle} />
        </FinancePanel>
        {children}
      </div>
    </section>
  );
}
