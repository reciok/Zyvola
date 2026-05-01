import { ReactNode } from "react";

interface FinanceBadgeProps {
  children: ReactNode;
  tone?: "gold" | "neutral" | "success";
}

const tones = {
  gold: "border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#F3D67F]",
  neutral: "border-zinc-700 bg-zinc-900 text-zinc-200",
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
};

export function FinanceBadge({ children, tone = "gold" }: FinanceBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
