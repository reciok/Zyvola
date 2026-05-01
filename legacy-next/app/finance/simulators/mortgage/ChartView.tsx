"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { MortgagePoint } from "./types";

export function MortgageChartView({ points }: { points: MortgagePoint[] }) {
  return <FinanceLineChart data={points} yKey="balance" xKey="year" />;
}
