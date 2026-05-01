import { MortgageInputs } from "./types";

export const MORTGAGE_DEFAULTS: MortgageInputs = {
  homePrice: 250000,
  downPaymentPct: 20,
  annualRate: 3.8,
  years: 30
};

export const MORTGAGE_LIMITS = {
  homePrice: { min: 50000, max: 1200000, step: 1000 },
  downPaymentPct: { min: 5, max: 60, step: 1 },
  annualRate: { min: 1, max: 12, step: 0.1 },
  years: { min: 5, max: 40, step: 1 }
};
