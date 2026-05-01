import { FinanceShell } from "@/components/finance/FinanceShell";
import { InflationSimulatorClient } from "./SimulatorClient";

export default function InflationPage() {
  return (
    <FinanceShell
      title="Simulador: Inflacion"
      subtitle="Visualiza como cambia el poder adquisitivo de tu dinero en el tiempo."
    >
      <InflationSimulatorClient />
    </FinanceShell>
  );
}
