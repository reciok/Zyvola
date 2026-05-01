"use client";

import { ChangeEvent } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { useFinanceStore } from "@/store/finance/useFinanceStore";
import { OPPORTUNITY_LIMITS } from "./constants";
import { OpportunityCostChartView } from "./ChartView";
import { OpportunityCostResultsPanel } from "./ResultsPanel";
import { useOpportunityCostCalculator } from "./useCalculator";

export function OpportunityCostSimulatorClient() {
  const { inputs, setInputs, result } = useOpportunityCostCalculator();
  const completeSimulation = useFinanceStore((state) => state.completeSimulation);

  const update = (key: keyof typeof inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const share = async () => {
    const text = `Coste de oportunidad estimado: ${Math.round(result.opportunityCost)} EUR`;
    if (navigator.share) await navigator.share({ title: "Zyvola Finance", text });
    else await navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <PremiumCard title="Parametros" icon="IP">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Capital
              <input type="range" min={OPPORTUNITY_LIMITS.amount.min} max={OPPORTUNITY_LIMITS.amount.max} step={OPPORTUNITY_LIMITS.amount.step} value={inputs.amount} onChange={update("amount")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.amount} onChange={update("amount")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Retorno anual (%)
              <input type="range" min={OPPORTUNITY_LIMITS.annualReturn.min} max={OPPORTUNITY_LIMITS.annualReturn.max} step={OPPORTUNITY_LIMITS.annualReturn.step} value={inputs.annualReturn} onChange={update("annualReturn")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualReturn} onChange={update("annualReturn")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Anos
              <input type="range" min={OPPORTUNITY_LIMITS.years.min} max={OPPORTUNITY_LIMITS.years.max} step={OPPORTUNITY_LIMITS.years.step} value={inputs.years} onChange={update("years")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.years} onChange={update("years")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
          </div>
        </PremiumCard>
        <PremiumCard title="Grafico dinamico" icon="CH">
          <OpportunityCostChartView points={result.points} />
        </PremiumCard>
      </div>
      <div className="space-y-4">
        <OpportunityCostResultsPanel result={result} />
        <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[#F3D67F]">Compartir resultado</button>
            <button onClick={() => completeSimulation("Coste de oportunidad")} className="rounded-md border border-zinc-600 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200">Guardar actividad</button>
          </div>
        </div>
      </div>
    </div>
  );
}
