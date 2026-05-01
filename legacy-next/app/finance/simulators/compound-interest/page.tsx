import { FinanceShell } from "@/components/finance/FinanceShell";
import { CompoundInterestSimulatorClient } from "./SimulatorClient";

export default function CompoundInterestPage() {
  return (
    <FinanceShell
      title="Simulador: Interes compuesto"
      subtitle="Evalua crecimiento de capital en diferentes horizontes, tasas y frecuencias de capitalizacion."
    >
      <CompoundInterestSimulatorClient />
    </FinanceShell>
  );
}
