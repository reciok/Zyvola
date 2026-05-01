"use client";

import Link from "next/link";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinanceProgressBar } from "@/components/finance/ui/FinanceProgressBar";
import { useFinanceStore } from "@/store/finance/useFinanceStore";

const statusText: Record<string, string> = {
  pending: "Pendiente",
  "in-progress": "En progreso",
  completed: "Completado"
};

export function ChallengesClient() {
  const { activeChallenges, completedChallenges, completeChallenge } = useFinanceStore();
  const all = [...activeChallenges, ...completedChallenges];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {all.map((challenge) => (
        <FinanceCard
          key={challenge.id}
          title={challenge.title}
          icon="RT"
          footer={
            <div className="space-y-3">
              <FinanceProgressBar value={challenge.progress} label="Progreso" />
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{statusText[challenge.status]}</span>
                <span>{challenge.progress}%</span>
              </div>
              <FinanceBadge tone={challenge.status === "completed" ? "success" : "gold"}>{challenge.reward}</FinanceBadge>
              <FinanceCTA href={`/finance/challenges/${challenge.id}`} variant="ghost">Ver detalle</FinanceCTA>
              {challenge.status !== "completed" ? (
                <FinanceCTA onClick={() => completeChallenge(challenge.id)}>Marcar completado</FinanceCTA>
              ) : null}
            </div>
          }
        >
          {challenge.description}
        </FinanceCard>
      ))}
    </div>
  );
}
