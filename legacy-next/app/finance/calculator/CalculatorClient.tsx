"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceIcon } from "@/components/finance/ui/FinanceIcon";

interface InputsState {
  initialCapital: number;
  monthlyContribution: number;
  annualRate: number;
  years: number;
}

const initialInputs: InputsState = {
  initialCapital: 5000,
  monthlyContribution: 300,
  annualRate: 7,
  years: 15
};

export function CalculatorClient() {
  const [inputs, setInputs] = useState<InputsState>(initialInputs);

  const result = useMemo(() => {
    const monthlyRate = inputs.annualRate / 100 / 12;
    const months = inputs.years * 12;
    let total = inputs.initialCapital;
    for (let i = 0; i < months; i += 1) {
      total = total * (1 + monthlyRate) + inputs.monthlyContribution;
    }
    const invested = inputs.initialCapital + inputs.monthlyContribution * months;
    const gain = total - invested;
    return { total, invested, gain };
  }, [inputs]);

  const update = (key: keyof InputsState) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const bars = [
    { label: "Capital aportado", value: result.invested, tone: "bg-zinc-500" },
    { label: "Ganancia estimada", value: result.gain, tone: "bg-[#D4AF37]" }
  ];
  const maxValue = Math.max(result.total, 1);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <PremiumCard title="Entradas" icon="IN">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Capital inicial
            <input type="range" min={0} max={100000} step={500} value={inputs.initialCapital} onChange={update("initialCapital")} className="mt-1 w-full accent-[#D4AF37]" />
            <input type="number" value={inputs.initialCapital} onChange={update("initialCapital")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
          </label>
          <label className="text-sm">
            Aporte mensual
            <input type="range" min={0} max={5000} step={50} value={inputs.monthlyContribution} onChange={update("monthlyContribution")} className="mt-1 w-full accent-[#D4AF37]" />
            <input type="number" value={inputs.monthlyContribution} onChange={update("monthlyContribution")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
          </label>
          <label className="text-sm">
            Rentabilidad anual (%)
            <input type="range" min={0} max={20} step={0.1} value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full accent-[#D4AF37]" />
            <input type="number" value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
          </label>
          <label className="text-sm">
            Horizonte (años)
            <input type="range" min={1} max={40} step={1} value={inputs.years} onChange={update("years")} className="mt-1 w-full accent-[#D4AF37]" />
            <input type="number" value={inputs.years} onChange={update("years")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
          </label>
        </div>
      </PremiumCard>

      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-700/50 pb-3">
          <FinanceIcon label="RS" size="sm" />
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">Resultados</h3>
        </div>

        {/* Hero Metric */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] border-l-emerald-400/70 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4AF37]/40 via-transparent to-emerald-500/20" />
          <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-sm text-emerald-500">📈</div>
          <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Total proyectado</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-100">€ {result.total.toFixed(0)}</p>
          <p className="mt-2 text-xs text-zinc-500">Proyeccion basada en aportes mensuales y capitalizacion compuesta.</p>
        </div>

        {/* Breakdown Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="group relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] border-l-amber-400/70 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60 hover:shadow-lg hover:shadow-black/20">
            <div className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-sm text-amber-500">💵</div>
            <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Capital aportado</p>
            <p className="text-xl font-bold tracking-tight text-zinc-100">€ {result.invested.toFixed(0)}</p>
          </div>
          <div className="group relative overflow-hidden rounded-xl border border-zinc-700/50 border-l-[3px] border-l-emerald-400/70 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60 hover:shadow-lg hover:shadow-black/20">
            <div className="mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-sm text-emerald-500">💰</div>
            <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Ganancia estimada</p>
            <p className="text-xl font-bold tracking-tight text-zinc-100">€ {result.gain.toFixed(0)}</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="overflow-hidden rounded-xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/60 to-zinc-950/70 p-4">
          <p className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">Composicion del resultado</p>
          <div className="space-y-3">
            {bars.map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                  <span>{bar.label}</span>
                  <span className="font-medium text-zinc-300">€ {bar.value.toFixed(0)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className={`h-2.5 rounded-full ${bar.tone} transition-all duration-500`} style={{ width: `${Math.min((bar.value / maxValue) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
