import { OpportunityCostInputs } from "./types";

export const OPPORTUNITY_DEFAULTS: OpportunityCostInputs = {
  amount: 10000,
  annualReturn: 8,
  years: 15
};

export const OPPORTUNITY_LIMITS = {
  amount: { min: 100, max: 300000, step: 100 },
  annualReturn: { min: 1, max: 20, step: 0.1 },
  years: { min: 1, max: 40, step: 1 }
};
