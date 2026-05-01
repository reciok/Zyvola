import { notFound } from "next/navigation";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { financeChallenges } from "@/lib/finance/data";
import { ChallengeDetailClient } from "./ChallengeDetailClient";

export default function ChallengeDetailPage({ params }: { params: { challengeId: string } }) {
  const challenge = financeChallenges.find((item) => item.id === params.challengeId);
  if (!challenge) return notFound();

  return (
    <FinanceShell
      title="Detalle de reto"
      subtitle="Objetivo, pasos y recompensa visual para mantener ejecucion constante."
    >
      <div className="mb-4">
        <FinanceCTA href="/finance/challenges" variant="ghost">Volver a retos</FinanceCTA>
      </div>
      <ChallengeDetailClient
        challengeId={challenge.id}
        fallbackTitle={challenge.title}
        fallbackDescription={challenge.description}
        fallbackReward={challenge.reward}
      />
    </FinanceShell>
  );
}
