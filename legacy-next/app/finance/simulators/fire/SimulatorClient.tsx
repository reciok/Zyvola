"use client";

import { ChangeEvent } from "react";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { useFinanceStore } from "@/store/finance/useFinanceStore";
import { FIRE_LIMITS } from "./constants";
import { FireChartView } from "./ChartView";
import { FireResultsPanel } from "./ResultsPanel";
import { useFireCalculator } from "./useCalculator";
import { FireMode } from "./types";

const fireModeLabel: Record<FireMode, string> = {
  lean: "Basico",
  fat: "Amplio",
  coast: "Sin aportar"
};

export function FireSimulatorClient() {
  const { inputs, setInputs, result } = useFireCalculator();
  const completeSimulation = useFinanceStore((state) => state.completeSimulation);

  const update = (key: keyof typeof inputs) => (event: ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(event.target.value) }));
  };

  const updateMode = (mode: FireMode) => setInputs((prev) => ({ ...prev, mode }));

  const share = async () => {
    const text = `Meta FIRE ${Math.round(result.targetCapital)} EUR en ${result.yearsToFire || "N/D"} anos`;
    if (navigator.share) await navigator.share({ title: "Zyvola Finance", text });
    else await navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <PremiumCard title="Parametros" icon="IP">
          <div className="mb-3 flex flex-wrap gap-2">
            {(["lean", "fat", "coast"] as FireMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateMode(mode)}
                className={`rounded-md border px-3 py-2 text-xs uppercase tracking-[0.14em] ${inputs.mode === mode ? "border-[#D4AF37] text-[#F3D67F]" : "border-zinc-700 text-zinc-300"}`}
              >
                {fireModeLabel[mode]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Gasto anual
              <input type="range" min={FIRE_LIMITS.annualSpending.min} max={FIRE_LIMITS.annualSpending.max} step={FIRE_LIMITS.annualSpending.step} value={inputs.annualSpending} onChange={update("annualSpending")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualSpending} onChange={update("annualSpending")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Ahorro actual
              <input type="range" min={FIRE_LIMITS.currentPortfolio.min} max={FIRE_LIMITS.currentPortfolio.max} step={FIRE_LIMITS.currentPortfolio.step} value={inputs.currentPortfolio} onChange={update("currentPortfolio")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.currentPortfolio} onChange={update("currentPortfolio")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Aporte anual
              <input type="range" min={FIRE_LIMITS.annualContribution.min} max={FIRE_LIMITS.annualContribution.max} step={FIRE_LIMITS.annualContribution.step} value={inputs.annualContribution} onChange={update("annualContribution")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualContribution} onChange={update("annualContribution")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
            <label className="text-sm">Retorno anual (%)
              <input type="range" min={FIRE_LIMITS.annualReturn.min} max={FIRE_LIMITS.annualReturn.max} step={FIRE_LIMITS.annualReturn.step} value={inputs.annualReturn} onChange={update("annualReturn")} className="mt-1 w-full accent-[#D4AF37] transition-all duration-200" />
              <input type="number" value={inputs.annualReturn} onChange={update("annualReturn")} className="mt-1 w-full rounded-md border border-[#8BE6E6] bg-[#ECFCFC] text-[#0E5858] px-2 py-1 focus:border-[#1CC7C7] focus:outline-none focus:ring-2 focus:ring-[#1CC7C7]/35" />
            </label>
          </div>
        </PremiumCard>
        <PremiumCard title="Grafico dinamico" icon="CH">
          <FireChartView points={result.points} />
        </PremiumCard>
      </div>
      <div className="space-y-4">
        <FireResultsPanel result={result} />
        <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={share} className="rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[#F3D67F]">Compartir resultado</button>
            <button onClick={() => completeSimulation("Meta FIRE") } className="rounded-md border border-zinc-600 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200">Guardar actividad</button>
          </div>
        </div>
      </div>
    </div>
  );
}
