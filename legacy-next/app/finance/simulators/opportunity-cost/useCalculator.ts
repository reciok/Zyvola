"use client";

import { useMemo, useState } from "react";
import { OPPORTUNITY_DEFAULTS } from "./constants";
import { OpportunityCostInputs, OpportunityCostResult } from "./types";

function calculateOpportunityCost(inputs: OpportunityCostInputs): OpportunityCostResult {
  const { amount, annualReturn, years } = inputs;
  const rate = annualReturn / 100;
  const points: OpportunityCostResult["points"] = [];

  for (let year = 1; year <= years; year += 1) {
    points.push({
      year,
      investedPath: Number((amount * Math.pow(1 + rate, year)).toFixed(2)),
      notInvestedPath: amount
    });
  }

  const finalInvested = points[points.length - 1]?.investedPath ?? amount;
  const finalNotInvested = amount;
  const opportunityCost = Math.max(finalInvested - finalNotInvested, 0);
  const insight =
    opportunityCost > amount
      ? "No invertir tiene un coste acumulado alto en horizontes largos."
      : "El coste de oportunidad es moderado, pero crece con el tiempo.";

  return { finalInvested, finalNotInvested, opportunityCost, points, insight };
}

export function useOpportunityCostCalculator() {
  const [inputs, setInputs] = useState(OPPORTUNITY_DEFAULTS);
  const result = useMemo(() => calculateOpportunityCost(inputs), [inputs]);
  return { inputs, setInputs, result };
}
