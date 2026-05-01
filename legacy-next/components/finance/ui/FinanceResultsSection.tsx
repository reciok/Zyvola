import { ReactNode } from "react";
import { FinanceIcon } from "./FinanceIcon";

interface Metric {
  label: string;
  value: string;
  icon?: string;
  tone?: "positive" | "neutral" | "negative";
}

interface FinanceResultsSectionProps {
  metrics: Metric[];
  insight?: string;
  children?: ReactNode;
}

const toneStyles = {
  positive: {
    border: "border-l-emerald-400/70",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    icon: "↑",
  },
  neutral: {
    border: "border-l-amber-400/70",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    icon: "~",
  },
  negative: {
    border: "border-l-rose-400/70",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    icon: "↓",
  },
};

export function FinanceResultsSection({ metrics, insight, children }: FinanceResultsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-700/50 pb-3">
        <FinanceIcon label="RS" size="sm" />
        <h3 className="text-base font-semibold tracking-tight text-zinc-100">Resultados</h3>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {metrics.map((metric) => {
          const tone = toneStyles[metric.tone ?? "neutral"];
          return (
            <div
              key={metric.label}
              className={`group relative overflow-hidden rounded-xl border border-zinc-700/50 ${tone.border} border-l-[3px] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60 hover:shadow-lg hover:shadow-black/20`}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4AF37]/30 via-transparent to-[#D4AF37]/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className={`mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md ${tone.iconBg} text-sm ${tone.iconColor}`}>
                {metric.icon ?? tone.icon}
              </div>
              <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {metric.label}
              </p>
              <p className="text-xl font-bold tracking-tight text-zinc-100">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Insight Panel */}
      {insight && (
        <div className="overflow-hidden rounded-xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/60 to-zinc-950/70">
          <div className="flex items-center gap-2 border-b border-zinc-700/30 px-4 py-2.5">
            <span className="text-sm">💡</span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Lectura de resultados
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm leading-relaxed text-zinc-300">{insight}</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
