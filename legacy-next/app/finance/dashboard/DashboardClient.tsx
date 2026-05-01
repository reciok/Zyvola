"use client";

import Link from "next/link";
import { MetricCard } from "@/components/finance/MetricCard";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinanceGrid } from "@/components/finance/ui/FinanceGrid";
import { FinanceProgressBar } from "@/components/finance/ui/FinanceProgressBar";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { useFinanceStore } from "@/store/finance/useFinanceStore";

export function DashboardClient() {
  const {
    userProgress,
    learnedConcepts,
    simulationsCompleted,
    completedChallenges,
    financialLevel,
    activityHistory
  } = useFinanceStore();

  return (
    <div className="space-y-6">
      <section>
        <FinanceSectionHeader title="Panel Financiero" subtitle="Vista ejecutiva para decisiones semanales." />
        <FinanceGrid cols="4">
        <MetricCard label="Progreso" value={`${userProgress}%`} />
        <MetricCard label="Conceptos aprendidos" value={learnedConcepts.length} />
        <MetricCard label="Simulaciones" value={simulationsCompleted} />
        <MetricCard label="Retos completados" value={completedChallenges.length} />
        <MetricCard label="Nivel" value={financialLevel} />
        </FinanceGrid>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <PremiumCard title="Pulso de rendimiento" icon="PR">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Disciplina de aportes</span>
                <span>74%</span>
              </div>
              <div className="h-2 rounded bg-zinc-800">
                <div className="h-2 w-[74%] rounded bg-[#D4AF37]" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Diversificacion</span>
                <span>61%</span>
              </div>
              <div className="h-2 rounded bg-zinc-800">
                <div className="h-2 w-[61%] rounded bg-[#D4AF37]" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Control de riesgo</span>
                <span>68%</span>
              </div>
              <div className="h-2 rounded bg-zinc-800">
                <div className="h-2 w-[68%] rounded bg-[#D4AF37]" />
              </div>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="Estado de cartera" icon="CR">
          <div className="space-y-2 text-sm text-zinc-300">
            <p><span className="text-zinc-500">Volatilidad:</span> Media</p>
            <p><span className="text-zinc-500">Liquidez:</span> Alta</p>
            <p><span className="text-zinc-500">Sesgo:</span> Crecimiento</p>
            <p><span className="text-zinc-500">Balance ideal:</span> 70/20/10</p>
          </div>
          <div className="mt-3"><FinanceBadge tone="gold">Objetivo anual activo</FinanceBadge></div>
        </PremiumCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <PremiumCard title="Accesos rapidos" icon="QR">
          <div className="flex flex-wrap gap-2">
            <FinanceCTA href="/finance/simulators">Simuladores</FinanceCTA>
            <FinanceCTA href="/finance/calculator">Calculadora</FinanceCTA>
            <FinanceCTA href="/finance/optimizer">Optimizador</FinanceCTA>
            <FinanceCTA href="/finance/analyzer">Analizador</FinanceCTA>
          </div>
        </PremiumCard>

        <PremiumCard title="Actividad reciente" icon="AC">
          <ul className="space-y-2">
            {activityHistory.map((item) => (
              <li key={item.id} className="rounded-lg border border-zinc-800 p-2 text-sm">
                <p>{item.message}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.date}</p>
              </li>
            ))}
          </ul>
        </PremiumCard>

        <PremiumCard title="Tu nivel financiero" icon="LV">
          <p className="mb-3">Continua avanzando para consolidar tu precision estrategica.</p>
          <FinanceProgressBar value={userProgress} label="Nivel global" />
          <div className="mt-3"><FinanceBadge tone="gold">{financialLevel}</FinanceBadge></div>
        </PremiumCard>
      </section>

      <section>
        <FinanceSectionHeader title="Continuar donde lo dejaste" subtitle="Flujo recomendado segun tu actividad reciente." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <PremiumCard title="Retomar simulaciones" icon="RS" footer={<FinanceCTA href="/finance/simulators">Ir ahora</FinanceCTA>}>
            Llevas {simulationsCompleted} simulaciones. Completa una nueva comparativa esta semana.
          </PremiumCard>
          <PremiumCard title="Ajustar estrategia" icon="OP" footer={<FinanceCTA href="/finance/optimizer">Optimizar</FinanceCTA>}>
            Revisa pesos de cartera y minimiza fricciones antes de abrir nuevas posiciones.
          </PremiumCard>
          <PremiumCard title="Refuerzo educativo" icon="GD" footer={<FinanceCTA href="/finance/guides">Abrir guias</FinanceCTA>}>
            Repasa conceptos clave y conecalos con simuladores para mejorar decisiones.
          </PremiumCard>
        </div>
      </section>

      <section>
        <PremiumCard title="Mapa de flujo recomendado" icon="MF">
          <div className="grid gap-2 md:grid-cols-4">
            <Link href="/finance/dashboard" className="rounded-lg border border-zinc-800 p-3 text-sm hover:border-[#D4AF37]/50">1. Panel</Link>
            <Link href="/finance/simulators" className="rounded-lg border border-zinc-800 p-3 text-sm hover:border-[#D4AF37]/50">2. Simular</Link>
            <Link href="/finance/analyzer" className="rounded-lg border border-zinc-800 p-3 text-sm hover:border-[#D4AF37]/50">3. Analizar</Link>
            <Link href="/finance/optimizer" className="rounded-lg border border-zinc-800 p-3 text-sm hover:border-[#D4AF37]/50">4. Optimizar</Link>
          </div>
        </PremiumCard>
      </section>
    </div>
  );
}
