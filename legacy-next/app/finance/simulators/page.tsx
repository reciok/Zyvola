import { FinanceShell } from "@/components/finance/FinanceShell";
import { SimulatorHubCard } from "@/components/finance/SimulatorHubCard";
import { FinanceGrid } from "@/components/finance/ui/FinanceGrid";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { simulatorLinks } from "@/lib/finance/data";

export default function FinanceSimulatorsPage() {
  return (
    <FinanceShell
      title="Simuladores financieros"
      subtitle="Herramientas interactivas para entender mejor cada decision."
    >
      <FinanceSectionHeader
        title="Elige un simulador"
        subtitle="Todos tienen la misma estructura: datos de entrada, grafico y resultados claros."
      />
      <FinanceGrid cols="3">
        {simulatorLinks.map((simulator) => (
          <SimulatorHubCard key={simulator.slug} simulator={simulator} />
        ))}
      </FinanceGrid>
    </FinanceShell>
  );
}
