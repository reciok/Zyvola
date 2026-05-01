"use client";

import { useMemo, useState } from "react";
import { FIRE_DEFAULTS, FIRE_MULTIPLIERS } from "./constants";
import { FireInputs, FireResult } from "./types";

function calculateFire(inputs: FireInputs): FireResult {
  const modeLabel: Record<FireInputs["mode"], string> = {
    lean: "Basico",
    fat: "Amplio",
    coast: "Sin aportar"
  };

  const multiplier = FIRE_MULTIPLIERS[inputs.mode];
  const targetCapital = inputs.annualSpending * multiplier;
  const rate = inputs.annualReturn / 100;

  const points: FireResult["points"] = [];
  let portfolio = inputs.currentPortfolio;
  let yearsToFire = 0;

  for (let year = 1; year <= 60; year += 1) {
    portfolio = (portfolio + inputs.annualContribution) * (1 + rate);
    points.push({ year, portfolio: Number(portfolio.toFixed(2)) });
    if (!yearsToFire && portfolio >= targetCapital) {
      yearsToFire = year;
    }
  }

  const insight =
    yearsToFire > 0
      ? `Podrias alcanzar la meta ${modeLabel[inputs.mode]} en aproximadamente ${yearsToFire} anos.`
      : "Con este escenario no alcanzas el objetivo en 60 anos; revisa aportes o gasto objetivo.";

  return { targetCapital, yearsToFire, points, insight };
}

export function useFireCalculator() {
  const [inputs, setInputs] = useState(FIRE_DEFAULTS);
  const result = useMemo(() => calculateFire(inputs), [inputs]);
  return { inputs, setInputs, result };
}
