export interface MortgageInputs {
  homePrice: number;
  downPaymentPct: number;
  annualRate: number;
  years: number;
}

export interface MortgagePoint {
  year: number;
  balance: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  points: MortgagePoint[];
  insight: string;
}
