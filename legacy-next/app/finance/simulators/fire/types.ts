export type FireMode = "lean" | "fat" | "coast";

export interface FireInputs {
  annualSpending: number;
  currentPortfolio: number;
  annualContribution: number;
  annualReturn: number;
  mode: FireMode;
}

export interface FirePoint {
  year: number;
  portfolio: number;
}

export interface FireResult {
  targetCapital: number;
  yearsToFire: number;
  points: FirePoint[];
  insight: string;
}
