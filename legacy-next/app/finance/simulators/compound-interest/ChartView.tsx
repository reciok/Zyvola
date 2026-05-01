"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { CompoundPoint } from "./types";

export function CompoundChartView({ points }: { points: CompoundPoint[] }) {
  return <FinanceLineChart data={points} yKey="balance" xKey="year" />;
}
