import Link from "next/link";
import { SimulatorLink } from "@/lib/finance/types";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";

interface SimulatorHubCardProps {
  simulator: SimulatorLink;
}

export function SimulatorHubCard({ simulator }: SimulatorHubCardProps) {
  return (
    <FinanceCard
      title={simulator.title}
      icon="SM"
      footer={<FinanceCTA href={`/finance/simulators/${simulator.slug}`}>Abrir simulador</FinanceCTA>}
    >
      {simulator.description}
    </FinanceCard>
  );
}
