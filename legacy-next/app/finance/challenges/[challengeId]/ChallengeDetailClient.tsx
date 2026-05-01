"use client";

import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinancePanel } from "@/components/finance/ui/FinancePanel";
import { FinanceProgressBar } from "@/components/finance/ui/FinanceProgressBar";
import { useFinanceStore } from "@/store/finance/useFinanceStore";

interface ChallengeDetailClientProps {
  challengeId: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackReward: string;
}

export function ChallengeDetailClient({
  challengeId,
  fallbackTitle,
  fallbackDescription,
  fallbackReward
}: ChallengeDetailClientProps) {
  const { activeChallenges, completedChallenges, completeChallenge } = useFinanceStore();
  const challenge = [...activeChallenges, ...completedChallenges].find((item) => item.id === challengeId);

  const title = challenge?.title || fallbackTitle;
  const description = challenge?.description || fallbackDescription;
  const reward = challenge?.reward || fallbackReward;
  const progress = challenge?.progress ?? 0;
  const completed = challenge?.status === "completed";

  const steps = [
    "Define un objetivo medible y diario.",
    "Registra avance en el dashboard de Finance.",
    "Completa el desafio dentro del plazo propuesto."
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <FinancePanel>
        <h2 className="mb-2 text-2xl font-semibold text-zinc-100">{title}</h2>
        <p className="text-zinc-300">{description}</p>
        <div className="mt-4 space-y-2">
          <p className="text-sm uppercase tracking-[0.14em] text-[#D4AF37]">Pasos</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-300">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </FinancePanel>

      <FinancePanel>
        <div className="space-y-4">
          <FinanceProgressBar value={progress} label="Progreso del reto" />
          <FinanceBadge tone={completed ? "success" : "gold"}>{completed ? "Completado" : "En progreso"}</FinanceBadge>
          <FinanceBadge tone="gold">{reward}</FinanceBadge>
          {!completed ? (
            <FinanceCTA onClick={() => completeChallenge(challengeId)}>Completar reto</FinanceCTA>
          ) : null}
        </div>
      </FinancePanel>
    </div>
  );
}
