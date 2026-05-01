import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { ChallengesClient } from "./ChallengesClient";

export default function FinanceChallengesPage() {
  return (
    <FinanceShell
      title="Retos financieros"
      subtitle="Gamificacion premium para crear habitos de ejecucion medible."
    >
      <FinanceSectionHeader title="Retos activos y completados" subtitle="Sigue progreso, estado y recompensa visual en una sola vista." />
      <ChallengesClient />
    </FinanceShell>
  );
}
