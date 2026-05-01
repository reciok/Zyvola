import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { CalculatorClient } from "./CalculatorClient";

export default function FinanceCalculatorPage() {
  return (
    <FinanceShell
      title="Calculadora financiera"
      subtitle="Modulo de calculo rapido para objetivos de ahorro e inversion."
    >
      <FinanceSectionHeader
        title="Calcula tu escenario"
        subtitle="Ajusta capital, aporte, rentabilidad y tiempo para definir tu meta real."
      />
      <CalculatorClient />
    </FinanceShell>
  );
}
