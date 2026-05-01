"use client";

import Link from "next/link";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { financeGuides } from "@/lib/finance/data";
import { useFinanceStore } from "@/store/finance/useFinanceStore";

export function GuidesClient() {
  const markConceptLearned = useFinanceStore((state) => state.markConceptLearned);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {financeGuides.map((guide) => (
        <FinanceCard
          key={guide.id}
          title={guide.title}
          icon="GD"
          footer={
            <div className="space-y-3">
              <div className="rounded-lg border border-[#D4AF37]/30 bg-black/60 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#D4AF37]">Grafico simple</p>
                <div className="mt-2 h-12 rounded bg-gradient-to-r from-[#D4AF37]/25 to-transparent" />
                <p className="mt-2 text-xs text-zinc-400">{guide.chartLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FinanceBadge tone="gold">30-60s</FinanceBadge>
                <FinanceCTA onClick={() => markConceptLearned(guide.title)}>Marcar aprendido</FinanceCTA>
                <FinanceCTA href={`/finance/guides/${guide.id}`} variant="ghost">Ver guia</FinanceCTA>
                <Link href={`/finance/simulators/${guide.ctaSimulator}`} className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-100 hover:underline">Simular esto</Link>
              </div>
            </div>
          }
        >
          <ul className="list-disc space-y-1 pl-5">
            {guide.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </FinanceCard>
      ))}
    </div>
  );
}
