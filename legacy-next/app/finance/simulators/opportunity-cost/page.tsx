import { FinanceShell } from "@/components/finance/FinanceShell";
import { OpportunityCostSimulatorClient } from "./SimulatorClient";

export default function OpportunityCostPage() {
  return (
    <FinanceShell
      title="Simulador: Coste de oportunidad"
      subtitle="Mide el impacto de posponer inversion frente a mantener capital inmovil."
    >
      <OpportunityCostSimulatorClient />
    </FinanceShell>
  );
}
