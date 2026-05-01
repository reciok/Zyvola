import { FinanceShell } from "@/components/finance/FinanceShell";
import { MortgageSimulatorClient } from "./SimulatorClient";

export default function MortgagePage() {
  return (
    <FinanceShell
      title="Simulador: Hipoteca"
      subtitle="Compara cuotas y coste total para tomar decisiones de deuda con mejor contexto."
    >
      <MortgageSimulatorClient />
    </FinanceShell>
  );
}
