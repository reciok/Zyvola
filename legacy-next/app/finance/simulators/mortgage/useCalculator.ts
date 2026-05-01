"use client";

import { useMemo, useState } from "react";
import { MORTGAGE_DEFAULTS } from "./constants";
import { MortgageInputs, MortgageResult } from "./types";

function calculateMortgage(inputs: MortgageInputs): MortgageResult {
  const loanAmount = inputs.homePrice * (1 - inputs.downPaymentPct / 100);
  const n = inputs.years * 12;
  const monthlyRate = inputs.annualRate / 100 / 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / n
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));

  let balance = loanAmount;
  const points: MortgageResult["points"] = [];

  for (let month = 1; month <= n; month += 1) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(balance - principal, 0);
    if (month % 12 === 0) {
      points.push({ year: month / 12, balance: Number(balance.toFixed(2)) });
    }
  }

  const totalPaid = monthlyPayment * n;
  const totalInterest = Math.max(totalPaid - loanAmount, 0);
  const insight =
    totalInterest > loanAmount
      ? "Los intereses superan el principal: reducir plazo puede recortar coste total."
      : "La estructura de deuda es eficiente en relacion al principal.";

  return {
    loanAmount,
    monthlyPayment,
    totalInterest,
    points,
    insight
  };
}

export function useMortgageCalculator() {
  const [inputs, setInputs] = useState(MORTGAGE_DEFAULTS);
  const result = useMemo(() => calculateMortgage(inputs), [inputs]);
  return { inputs, setInputs, result };
}
