import { FinanceResultsSection } from "@/components/finance/ui/FinanceResultsSection";
import { currency } from "@/lib/finance/utils";
import { MortgageResult } from "./types";

export function MortgageResultsPanel({ result }: { result: MortgageResult }) {
  return (
    <FinanceResultsSection
      metrics={[
        { label: "Prestamo", value: currency(result.loanAmount), tone: "neutral", icon: "🏠" },
        { label: "Cuota mensual", value: currency(result.monthlyPayment), tone: "neutral", icon: "📅" },
        { label: "Intereses totales", value: currency(result.totalInterest), tone: "negative", icon: "💸" },
      ]}
      insight={result.insight}
    />
  );
}
