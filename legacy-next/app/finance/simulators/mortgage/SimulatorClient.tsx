"use client";

import { ChangeEvent } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { useFinanceStore } from "@/store/finance/useFinanceStore";
import { MORTGAGE_LIMITS } from "./constants";
import { MortgageChartView } from "./ChartView";
import { MortgageResultsPanel } from "./ResultsPanel";
import { useMortgageCalculator } from "./useCalculator";

export function MortgageSimulatorClient() {
  const { inputs, setInputs, result } = useMortgageCalculator();
  const completeSimulation = useFinanceStore((state) => state.completeSimulation);

  const update = (key: keyof typeof inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const share = async () => {
    const text = `Hipoteca: cuota ${Math.round(result.monthlyPayment)} EUR/mes`;
    if (navigator.share) await navigator.share({ title: "Zyvola Finance", text });
    else await navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <PremiumCard title="Parametros" icon="IP">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Precio vivienda
              <input type="range" min={MORTGAGE_LIMITS.homePrice.min} max={MORTGAGE_LIMITS.homePrice.max} step={MORTGAGE_LIMITS.homePrice.step} value={inputs.homePrice} onChange={update("homePrice")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.homePrice} onChange={update("homePrice")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Entrada (%)
              <input type="range" min={MORTGAGE_LIMITS.downPaymentPct.min} max={MORTGAGE_LIMITS.downPaymentPct.max} step={MORTGAGE_LIMITS.downPaymentPct.step} value={inputs.downPaymentPct} onChange={update("downPaymentPct")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.downPaymentPct} onChange={update("downPaymentPct")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Tasa anual (%)
              <input type="range" min={MORTGAGE_LIMITS.annualRate.min} max={MORTGAGE_LIMITS.annualRate.max} step={MORTGAGE_LIMITS.annualRate.step} value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualRate} onChange={update("annualRate")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Anos
              <input type="range" min={MORTGAGE_LIMITS.years.min} max={MORTGAGE_LIMITS.years.max} step={MORTGAGE_LIMITS.years.step} value={inputs.years} onChange={update("years")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.years} onChange={update("years")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
          </div>
        </PremiumCard>
        <PremiumCard title="Grafico dinamico" icon="CH">
          <MortgageChartView points={result.points} />
        </PremiumCard>
      </div>
      <div className="space-y-4">
        <MortgageResultsPanel result={result} />
        <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[#F3D67F]">Compartir resultado</button>
            <button onClick={() => completeSimulation("Hipoteca")} className="rounded-md border border-zinc-600 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200">Guardar actividad</button>
          </div>
        </div>
      </div>
    </div>
  );
}
