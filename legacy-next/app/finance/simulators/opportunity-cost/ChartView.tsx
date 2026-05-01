"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { OpportunityCostPoint } from "./types";

export function OpportunityCostChartView({ points }: { points: OpportunityCostPoint[] }) {
  return <FinanceLineChart data={points} yKey="investedPath" xKey="year" />;
}
