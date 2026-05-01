"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceIcon } from "@/components/finance/ui/FinanceIcon";

interface AllocationState {
  equity: number;
  bonds: number;
  alternatives: number;
}

const initial: AllocationState = {
  equity: 70,
  bonds: 20,
  alternatives: 10
};

export function OptimizerClient() {
  const [allocation, setAllocation] = useState<AllocationState>(initial);

  const normalized = useMemo(() => {
    const sum = allocation.equity + allocation.bonds + allocation.alternatives || 1;
    return {
      equity: (allocation.equity / sum) * 100,
      bonds: (allocation.bonds / sum) * 100,
      alternatives: (allocation.alternatives / sum) * 100
    };
  }, [allocation]);

  const riskScore = useMemo(() => {
    return normalized.equity * 0.9 + normalized.alternatives * 1.1 + normalized.bonds * 0.35;
  }, [normalized]);

  const riskTone = riskScore > 70 ? "negative" : riskScore < 45 ? "positive" : "neutral";
  const riskLabel = riskScore > 70 ? "Agresivo" : riskScore < 45 ? "Conservador" : "Equilibrado";

  const suggestion = riskScore > 70
    ? "Perfil agresivo. Considera reducir renta variable si tu horizonte es corto."
    : riskScore < 45
      ? "Perfil conservador. Puedes subir crecimiento si tu horizonte es largo."
      : "Perfil equilibrado. Mantiene buen balance entre crecimiento y estabilidad.";

  const update = (key: keyof AllocationState) => (event: ChangeEvent<HTMLInputElement>) => {
    setAllocation((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const toneColors = {
    positive: { bar: "bg-emerald-500", border: "border-l-emerald-400/70", icon: "bg-emerald-500/10 text-emerald-500" },
    neutral: { bar: "bg-amber-500", border: "border-l-amber-400/70", icon: "bg-amber-500/10 text-amber-500" },
    negative: { bar: "bg-rose-500", border: "border-l-rose-400/70", icon: "bg-rose-500/10 text-rose-500" },
  };
  const tc = toneColors[riskTone];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <PremiumCard title="Asignacion objetivo" icon="AL">
        <div className="space-y-4">
          <label className="block text-sm">
            Renta variable
            <input type="range" min={0} max={100} value={allocation.equity} onChange={update("equity")} className="mt-1 w-full accent-[#D4AF37]" />
            <p className="mt-1 text-xs text-zinc-500">{normalized.equity.toFixed(1)}%</p>
          </label>
          <label className="block text-sm">
            Renta fija
            <input type="range" min={0} max={100} value={allocation.bonds} onChange={update("bonds")} className="mt-1 w-full accent-[#D4AF37]" />
            <p className="mt-1 text-xs text-zinc-500">{normalized.bonds.toFixed(1)}%</p>
          </label>
          <label className="block text-sm">
            Alternativos
            <input type="range" min={0} max={100} value={allocation.alternatives} onChange={update("alternatives")} className="mt-1 w-full accent-[#D4AF37]" />
            <p className="mt-1 text-xs text-zinc-500">{normalized.alternatives.toFixed(1)}%</p>
          </label>
        </div>
      </PremiumCard>

      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-700/50 pb-3">
          <FinanceIcon label="OP" size="sm" />
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">Resultado del optimizador</h3>
        </div>

        {/* Risk Score Hero */}
        <div className={`relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] ${tc.border} bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5`}>
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-transparent to-transparent" />
          <div className={`mb-3 inline-flex h-7 w-7 items-center justify-center rounded-md ${tc.icon} text-sm`}>⚖️</div>
          <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Indice de riesgo</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight text-zinc-100">{riskScore.toFixed(1)}</p>
            <span className="text-sm text-zinc-500">/ 100</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-2.5 rounded-full ${tc.bar} transition-all duration-500`} style={{ width: `${Math.min(riskScore, 100)}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[0.68rem] uppercase tracking-[0.1em] text-zinc-500">Conservador</span>
            <span className="text-[0.68rem] uppercase tracking-[0.1em] text-zinc-500">Agresivo</span>
          </div>
        </div>

        {/* Profile & Allocation Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`group relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] ${tc.border} bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60`}>
            <div className={`mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md ${tc.icon} text-sm`}>🏷️</div>
            <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Perfil detectado</p>
            <p className="text-xl font-bold tracking-tight text-zinc-100">{riskLabel}</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] border-l-amber-400/70 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60">
            <div className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-sm text-amber-500">📊</div>
            <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Mayor peso</p>
            <p className="text-xl font-bold tracking-tight text-zinc-100">{normalized.equity >= normalized.bonds && normalized.equity >= normalized.alternatives ? "Renta variable" : normalized.bonds >= normalized.alternatives ? "Renta fija" : "Alternativos"}</p>
          </div>
        </div>

        {/* Suggestion Insight */}
        <div className="overflow-hidden rounded-xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/60 to-zinc-950/70">
          <div className="flex items-center gap-2 border-b border-zinc-700/30 px-4 py-2.5">
            <span className="text-sm">💡</span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Recomendacion</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed text-zinc-300">{suggestion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
