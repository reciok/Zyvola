"use client";

import { ChangeEvent } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { useFinanceStore } from "@/store/finance/useFinanceStore";
import { INFLATION_LIMITS } from "./constants";
import { InflationChartView } from "./ChartView";
import { InflationResultsPanel } from "./ResultsPanel";
import { useInflationCalculator } from "./useCalculator";

export function InflationSimulatorClient() {
  const { inputs, setInputs, result } = useInflationCalculator();
  const completeSimulation = useFinanceStore((state) => state.completeSimulation);

  const update = (key: keyof typeof inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const share = async () => {
    const text = `Inflacion: valor real estimado ${Math.round(result.futureReal)} EUR`;
    if (navigator.share) await navigator.share({ title: "Zyvola Finance", text });
    else await navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <PremiumCard title="Parametros" icon="IP">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Capital actual
              <input type="range" min={INFLATION_LIMITS.currentAmount.min} max={INFLATION_LIMITS.currentAmount.max} step={INFLATION_LIMITS.currentAmount.step} value={inputs.currentAmount} onChange={update("currentAmount")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.currentAmount} onChange={update("currentAmount")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Inflacion anual (%)
              <input type="range" min={INFLATION_LIMITS.inflationRate.min} max={INFLATION_LIMITS.inflationRate.max} step={INFLATION_LIMITS.inflationRate.step} value={inputs.inflationRate} onChange={update("inflationRate")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.inflationRate} onChange={update("inflationRate")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Anos
              <input type="range" min={INFLATION_LIMITS.years.min} max={INFLATION_LIMITS.years.max} step={INFLATION_LIMITS.years.step} value={inputs.years} onChange={update("years")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.years} onChange={update("years")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
          </div>
        </PremiumCard>
        <PremiumCard title="Grafico dinamico" icon="CH">
          <InflationChartView points={result.points} />
        </PremiumCard>
      </div>
      <div className="space-y-4">
        <InflationResultsPanel result={result} />
        <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[#F3D67F]">Compartir resultado</button>
            <button onClick={() => completeSimulation("Inflacion")} className="rounded-md border border-zinc-600 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200">Guardar actividad</button>
          </div>
        </div>
      </div>
    </div>
  );
}
