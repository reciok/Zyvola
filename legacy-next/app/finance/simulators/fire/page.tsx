import { FinanceShell } from "@/components/finance/FinanceShell";
import { FireSimulatorClient } from "./SimulatorClient";

export default function FirePage() {
  return (
    <FinanceShell
      title="Simulador: Meta FIRE"
      subtitle="Estima en cuantos anos podrias alcanzar tu libertad financiera."
    >
      <FireSimulatorClient />
    </FinanceShell>
  );
}
