import { FinanceAnimatedNumber } from "@/components/finance/ui/FinanceAnimatedNumber";
import { FinancePanel } from "@/components/finance/ui/FinancePanel";

interface MetricCardProps {
  label: string;
  value: string | number;
}

export function MetricCard({ label, value }: MetricCardProps) {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  const isNumeric = Number.isFinite(numeric);
  const suffix = typeof value === "string" && value.includes("%") ? "%" : "";

  return (
    <FinancePanel className="rounded-xl p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F3D67F]">
        {isNumeric ? <FinanceAnimatedNumber value={numeric} suffix={suffix} /> : value}
      </p>
    </FinancePanel>
  );
}
