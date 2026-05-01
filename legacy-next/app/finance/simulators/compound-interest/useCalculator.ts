"use client";

import { useMemo, useState } from "react";
import { COMPOUND_DEFAULTS } from "./constants";
import { CompoundInputs, CompoundResult } from "./types";

function calculateCompound(inputs: CompoundInputs): CompoundResult {
  const { principal, annualRate, years, compoundsPerYear } = inputs;
  const rate = annualRate / 100;
  const points = [] as CompoundResult["points"];

  for (let year = 1; year <= years; year += 1) {
    const balance = principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * year);
    points.push({ year, balance: Number(balance.toFixed(2)) });
  }

  const finalValue = points[points.length - 1]?.balance ?? principal;
  const interestEarned = Math.max(finalValue - principal, 0);
  const ratio = finalValue / principal;
  const insight =
    ratio >= 3
      ? "El capital se multiplica de forma potente gracias al tiempo y la frecuencia de capitalizacion."
      : "Para acelerar resultados, prioriza horizonte temporal largo y aportes adicionales.";

  return { finalValue, interestEarned, points, insight };
}

export function useCompoundCalculator() {
  const [inputs, setInputs] = useState<CompoundInputs>(COMPOUND_DEFAULTS);
  const result = useMemo(() => calculateCompound(inputs), [inputs]);

  return { inputs, setInputs, result };
}
