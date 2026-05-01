export interface InflationInputs {
  currentAmount: number;
  inflationRate: number;
  years: number;
}

export interface InflationPoint {
  year: number;
  realValue: number;
}

export interface InflationResult {
  futureNominal: number;
  futureReal: number;
  purchasingPowerLoss: number;
  points: InflationPoint[];
  insight: string;
}
