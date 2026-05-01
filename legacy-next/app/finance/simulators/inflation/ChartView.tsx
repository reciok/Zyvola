"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { InflationPoint } from "./types";

export function InflationChartView({ points }: { points: InflationPoint[] }) {
  return <FinanceLineChart data={points} yKey="realValue" xKey="year" />;
}
