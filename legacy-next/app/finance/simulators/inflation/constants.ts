import { InflationInputs } from "./types";

export const INFLATION_DEFAULTS: InflationInputs = {
  currentAmount: 20000,
  inflationRate: 3,
  years: 15
};

export const INFLATION_LIMITS = {
  currentAmount: { min: 500, max: 500000, step: 100 },
  inflationRate: { min: 0.5, max: 15, step: 0.1 },
  years: { min: 1, max: 40, step: 1 }
};
