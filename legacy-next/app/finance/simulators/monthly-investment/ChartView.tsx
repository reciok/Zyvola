"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { MonthlyInvestmentPoint } from "./types";

export function MonthlyInvestmentChartView({ points }: { points: MonthlyInvestmentPoint[] }) {
  return <FinanceLineChart data={points} yKey="value" xKey="year" />;
}
