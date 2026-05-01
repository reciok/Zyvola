import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { FireResult } from "./types";

export function FireResultsPanel({ result }: { result: FireResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Capital objetivo FIRE", value: currency(result.targetCapital), tone: "positive", icon: "🎯" },
        { label: "Anos estimados", value: result.yearsToFire ? `${result.yearsToFire} años` : "No alcanzado", tone: result.yearsToFire ? "positive" : "negative", icon: "⏱️" },
      ]}
      insight={result.insight}
    />
  );
}
