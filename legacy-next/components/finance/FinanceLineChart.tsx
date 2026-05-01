"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface FinanceLineChartProps {
  data: Array<Record<string, number | string>>;
  xKey?: string;
  yKey: string;
}

export function FinanceLineChart({ data, xKey = "year", yKey }: FinanceLineChartProps) {
  return (
    <div className="h-64 w-full rounded-xl border border-[#D4AF37]/25 bg-black/50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey={xKey} stroke="#71717a" tick={{ fontSize: 12 }} />
          <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid rgba(212,175,55,0.5)",
              borderRadius: "10px",
              color: "#f4f4f5"
            }}
          />
          <Line type="monotone" dataKey={yKey} stroke="#D4AF37" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
