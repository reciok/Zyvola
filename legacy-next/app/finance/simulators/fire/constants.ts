import { FireInputs } from "./types";

export const FIRE_DEFAULTS: FireInputs = {
  annualSpending: 24000,
  currentPortfolio: 50000,
  annualContribution: 12000,
  annualReturn: 7,
  mode: "lean"
};

export const FIRE_LIMITS = {
  annualSpending: { min: 6000, max: 120000, step: 500 },
  currentPortfolio: { min: 0, max: 2000000, step: 1000 },
  annualContribution: { min: 0, max: 150000, step: 500 },
  annualReturn: { min: 1, max: 20, step: 0.1 }
};

export const FIRE_MULTIPLIERS = {
  lean: 22,
  fat: 30,
  coast: 25
};
