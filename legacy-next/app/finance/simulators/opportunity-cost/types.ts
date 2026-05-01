export interface OpportunityCostInputs {
  amount: number;
  annualReturn: number;
  years: number;
}

export interface OpportunityCostPoint {
  year: number;
  investedPath: number;
  notInvestedPath: number;
}

export interface OpportunityCostResult {
  finalInvested: number;
  finalNotInvested: number;
  opportunityCost: number;
  points: OpportunityCostPoint[];
  insight: string;
}
