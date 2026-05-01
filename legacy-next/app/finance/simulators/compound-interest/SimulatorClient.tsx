"use client";

import { ChangeEvent } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { useFinanceStore } from "@/store/finance/useFinanceStore";
import { COMPOUND_LIMITS } from "./constants";
import { CompoundChartView } from "./ChartView";
import { CompoundResultsPanel } from "./ResultsPanel";
import { useCompoundCalculator } from "./useCalculator";

export function CompoundInterestSimulatorClient() {
  const { inputs, setInputs, result } = useCompoundCalculator();
  const completeSimulation = useFinanceStore((state) => state.completeSimulation);

  const update = (key: keyof typeof inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const share = async () => {
    const text = `Resultado Interes Compuesto: ${Math.round(result.finalValue)} EUR`;
    if (navigator.share) {
      await navigator.share({ title: "Zyvola Finance", text });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <PremiumCard title="Parametros" icon="IP">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Capital inicial
              <input type="range" min={COMPOUND_LIMITS.principal.min} max={COMPOUND_LIMITS.principal.max} step={COMPOUND_LIMITS.principal.step} value={inputs.principal} onChange={update("principal")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.principal} onChange={update("principal")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Tasa anual (%)
              <input type="range" min={COMPOUND_LIMITS.annualRate.min} max={COMPOUND_LIMITS.annualRate.max} step={COMPOUND_LIMITS.annualRate.step} value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Anos
              <input type="range" min={COMPOUND_LIMITS.years.min} max={COMPOUND_LIMITS.years.max} step={COMPOUND_LIMITS.years.step} value={inputs.years} onChange={update("years")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.years} onChange={update("years")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Capitalizaciones por ano
              <input type="range" min={COMPOUND_LIMITS.compoundsPerYear.min} max={COMPOUND_LIMITS.compoundsPerYear.max} step={COMPOUND_LIMITS.compoundsPerYear.step} value={inputs.compoundsPerYear} onChange={update("compoundsPerYear")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.compoundsPerYear} onChange={update("compoundsPerYear")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
          </div>
        </PremiumCard>
        <PremiumCard title="Grafico dinamico" icon="CH">
          <CompoundChartView points={result.points} />
        </PremiumCard>
      </div>

      <div className="space-y-4">
        <CompoundResultsPanel result={result} />
        <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4">
          <p className="mb-3 text-sm text-zinc-300">Acciones</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[#F3D67F]">Compartir resultado</button>
            <button onClick={() => completeSimulation("Interes compuesto")} className="rounded-md border border-zinc-600 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200">Guardar actividad</button>
          </div>
        </div>
      </div>
    </div>
  );
}
