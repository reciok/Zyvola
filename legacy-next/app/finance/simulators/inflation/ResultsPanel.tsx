import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { InflationResult } from "./types";

export function InflationResultsPanel({ result }: { result: InflationResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Valor nominal futuro", value: currency(result.futureNominal), tone: "neutral", icon: "📊" },
        { label: "Valor real futuro", value: currency(result.futureReal), tone: "negative", icon: "📉" },
        { label: "Perdida poder adquisitivo", value: currency(result.purchasingPowerLoss), tone: "negative", icon: "🔻" },
      ]}
      insight={result.insight}
    />
  );
}
