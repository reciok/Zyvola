import { FinanceShell } from "@/components/finance/FinanceShell";
import { MonthlyInvestmentSimulatorClient } from "./SimulatorClient";

export default function MonthlyInvestmentPage() {
  return (
    <FinanceShell
      title="Simulador: Inversion mensual"
      subtitle="Proyecta aportes recurrentes y evalua crecimiento acumulado."
    >
      <MonthlyInvestmentSimulatorClient />
    </FinanceShell>
  );
}
