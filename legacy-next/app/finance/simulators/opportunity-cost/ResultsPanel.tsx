import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { OpportunityCostResult } from "./types";

export function OpportunityCostResultsPanel({ result }: { result: OpportunityCostResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Escenario invirtiendo", value: currency(result.finalInvested), tone: "positive", icon: "📈" },
        { label: "Escenario sin invertir", value: currency(result.finalNotInvested), tone: "neutral", icon: "📊" },
        { label: "Coste de oportunidad", value: currency(result.opportunityCost), tone: "negative", icon: "⚠️" },
      ]}
      insight={result.insight}
    />
  );
}
