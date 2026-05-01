"use client";

import { useMemo, useState } from "react";
import { MONTHLY_INVESTMENT_DEFAULTS } from "./constants";
import { MonthlyInvestmentInputs, MonthlyInvestmentResult } from "./types";

function calculateMonthlyInvestment(inputs: MonthlyInvestmentInputs): MonthlyInvestmentResult {
  const monthlyRate = inputs.annualRate / 100 / 12;
  const points: MonthlyInvestmentResult["points"] = [];
  let value = 0;

  for (let year = 1; year <= inputs.years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      value = (value + inputs.monthlyContribution) * (1 + monthlyRate);
    }
    points.push({
      year,
      invested: inputs.monthlyContribution * year * 12,
      value: Number(value.toFixed(2))
    });
  }

  const finalValue = points[points.length - 1]?.value ?? 0;
  const totalContributed = inputs.monthlyContribution * inputs.years * 12;
  const gains = Math.max(finalValue - totalContributed, 0);
  const insight =
    gains > totalContributed
      ? "Tus ganancias superan el capital aportado: el interes compuesto esta trabajando a tu favor."
      : "El crecimiento mejora al aumentar tiempo o tasa esperada.";

  return { finalValue, totalContributed, gains, points, insight };
}

export function useMonthlyInvestmentCalculator() {
  const [inputs, setInputs] = useState(MONTHLY_INVESTMENT_DEFAULTS);
  const result = useMemo(() => calculateMonthlyInvestment(inputs), [inputs]);
  return { inputs, setInputs, result };
}
