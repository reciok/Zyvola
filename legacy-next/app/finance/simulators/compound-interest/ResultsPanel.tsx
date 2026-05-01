import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { CompoundResult } from "./types";

export function CompoundResultsPanel({ result }: { result: CompoundResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Valor final", value: currency(result.finalValue), tone: "positive", icon: "📈" },
        { label: "Interes generado", value: currency(result.interestEarned), tone: "positive", icon: "💰" },
      ]}
      insight={result.insight}
    />
  );
}
