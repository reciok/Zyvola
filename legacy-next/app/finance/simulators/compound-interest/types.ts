export interface CompoundInputs {
  principal: number;
  annualRate: number;
  years: number;
  compoundsPerYear: number;
}

export interface CompoundPoint {
  year: number;
  balance: number;
}

export interface CompoundResult {
  finalValue: number;
  interestEarned: number;
  points: CompoundPoint[];
  insight: string;
}
