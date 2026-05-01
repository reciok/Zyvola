import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { OptimizerClient } from "./OptimizerClient";

export default function FinanceOptimizerPage() {
  return (
    <FinanceShell
      title="Optimizador financiero"
      subtitle="Ajusta la mezcla de cartera segun riesgo, horizonte y estabilidad deseada."
    >
      <FinanceSectionHeader
        title="Optimiza tu asignacion"
        subtitle="Simula pesos de cartera y recibe una lectura de balance de riesgo."
      />
      <OptimizerClient />
    </FinanceShell>
  );
}
