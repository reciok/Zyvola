import { CompoundInputs } from "./types";

export const COMPOUND_DEFAULTS: CompoundInputs = {
  principal: 10000,
  annualRate: 8,
  years: 15,
  compoundsPerYear: 12
};

export const COMPOUND_LIMITS = {
  principal: { min: 100, max: 200000, step: 100 },
  annualRate: { min: 1, max: 20, step: 0.1 },
  years: { min: 1, max: 40, step: 1 },
  compoundsPerYear: { min: 1, max: 12, step: 1 }
};
