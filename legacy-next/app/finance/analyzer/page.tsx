import { FinanceShell } from "@/components/finance/FinanceShell";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { FinanceIcon } from "@/components/finance/ui/FinanceIcon";

const diagnostics = [
  { title: "Riesgo de concentracion", value: "Moderado", detail: "2 posiciones superan el 12% del total.", tone: "neutral" as const, icon: "🎯" },
  { title: "Correlacion interna", value: "Alta", detail: "Demasiada exposicion al mismo factor de mercado.", tone: "negative" as const, icon: "🔗" },
  { title: "Cobertura inflacion", value: "Baja", detail: "Necesitas mas activos reales para escenarios de precios altos.", tone: "negative" as const, icon: "🛡️" },
  { title: "Liquidez", value: "Solida", detail: "La mayor parte de la cartera tiene salida rapida.", tone: "positive" as const, icon: "💧" }
];

const toneStyles = {
  positive: { border: "border-l-emerald-400/70", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500", valueBg: "text-emerald-400" },
  neutral: { border: "border-l-amber-400/70", iconBg: "bg-amber-500/10", iconColor: "text-amber-500", valueBg: "text-amber-400" },
  negative: { border: "border-l-rose-400/70", iconBg: "bg-rose-500/10", iconColor: "text-rose-500", valueBg: "text-rose-400" },
};

export default function FinanceAnalyzerPage() {
  return (
    <FinanceShell
      title="Analizador financiero"
      subtitle="Lectura tecnica de tu estrategia para reducir errores estructurales."
    >
      <FinanceSectionHeader
        title="Diagnostico de cartera"
        subtitle="Revisa concentracion, correlacion, cobertura y liquidez en una sola vista."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {diagnostics.map((item) => {
          const ts = toneStyles[item.tone];
          return (
            <div
              key={item.title}
              className={`group relative overflow-hidden rounded-xl border border-zinc-700/50 ${ts.border} border-l-[3px] bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600/60 hover:shadow-lg hover:shadow-black/20`}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4AF37]/30 via-transparent to-[#D4AF37]/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${ts.iconBg} text-base ${ts.iconColor}`}>
                {item.icon}
              </div>
              <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-zinc-500">{item.title}</p>
              <p className={`text-2xl font-bold tracking-tight ${ts.valueBg}`}>{item.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
            </div>
          );
        })}
      </div>

      <section className="mt-6">
        <div className="overflow-hidden rounded-xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/60 to-zinc-950/70">
          <div className="flex items-center gap-2 border-b border-zinc-700/30 px-5 py-3">
            <span className="text-sm">💡</span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Conclusiones del analisis</span>
          </div>
          <div className="grid gap-0 divide-y divide-zinc-700/20 xl:grid-cols-3 xl:divide-x xl:divide-y-0">
            {[
              { title: "Interpretacion rapida", icon: "IR", text: "La cartera esta orientada a crecimiento, pero la correlacion elevada puede amplificar caidas." },
              { title: "Accion sugerida", icon: "AC", text: "Traslada parte de renta variable a activos defensivos y revisa pesos en el optimizador." },
              { title: "Siguiente paso", icon: "NX", text: "Valida el ajuste en simuladores y contrasta el impacto en distintos escenarios." },
            ].map((item) => (
              <div key={item.icon} className="px-5 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <FinanceIcon label={item.icon} size="sm" />
                  <span className="text-sm font-semibold text-zinc-200">{item.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FinanceShell>
  );
}
