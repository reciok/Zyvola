"use client";

import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { FirePoint } from "./types";

export function FireChartView({ points }: { points: FirePoint[] }) {
  return <FinanceLineChart data={points} yKey="portfolio" xKey="year" />;
}
