import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { MonthlyInvestmentResult } from "./types";

export function MonthlyInvestmentResultsPanel({ result }: { result: MonthlyInvestmentResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Valor final", value: currency(result.finalValue), tone: "positive", icon: "📈" },
        { label: "Total aportado", value: currency(result.totalContributed), tone: "neutral", icon: "💵" },
        { label: "Ganancias", value: currency(result.gains), tone: "positive", icon: "💰" },
      ]}
      insight={result.insight}
    />
  );
}
