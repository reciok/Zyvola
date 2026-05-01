"use client";

import { useMemo, useState } from "react";
import { INFLATION_DEFAULTS } from "./constants";
import { InflationInputs, InflationResult } from "./types";

function calculateInflation(inputs: InflationInputs): InflationResult {
  const { currentAmount, inflationRate, years } = inputs;
  const rate = inflationRate / 100;
  const points: InflationResult["points"] = [];

  for (let year = 1; year <= years; year += 1) {
    const realValue = currentAmount / Math.pow(1 + rate, year);
    points.push({ year, realValue: Number(realValue.toFixed(2)) });
  }

  const futureNominal = currentAmount;
  const futureReal = points[points.length - 1]?.realValue ?? currentAmount;
  const purchasingPowerLoss = Math.max(futureNominal - futureReal, 0);
  const insight =
    purchasingPowerLoss > currentAmount * 0.35
      ? "La inflacion erosiona una parte relevante de tu capital; invertir puede proteger valor real."
      : "La perdida de poder adquisitivo es moderada, pero sigue siendo importante monitorizarla.";

  return { futureNominal, futureReal, purchasingPowerLoss, points, insight };
}

export function useInflationCalculator() {
  const [inputs, setInputs] = useState(INFLATION_DEFAULTS);
  const result = useMemo(() => calculateInflation(inputs), [inputs]);
  return { inputs, setInputs, result };
}
