import { MonthlyInvestmentInputs } from "./types";

export const MONTHLY_INVESTMENT_DEFAULTS: MonthlyInvestmentInputs = {
  monthlyContribution: 300,
  annualRate: 7,
  years: 20
};

export const MONTHLY_INVESTMENT_LIMITS = {
  monthlyContribution: { min: 50, max: 5000, step: 10 },
  annualRate: { min: 1, max: 20, step: 0.1 },
  years: { min: 1, max: 40, step: 1 }
};
