export interface MonthlyInvestmentInputs {
  monthlyContribution: number;
  annualRate: number;
  years: number;
}

export interface MonthlyInvestmentPoint {
  year: number;
  invested: number;
  value: number;
}

export interface MonthlyInvestmentResult {
  finalValue: number;
  totalContributed: number;
  gains: number;
  points: MonthlyInvestmentPoint[];
  insight: string;
}
