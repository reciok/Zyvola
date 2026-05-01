import Link from "next/link";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinanceMarketTicker } from "@/components/finance/ui/FinanceMarketTicker";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { marketTickerData } from "@/lib/finance/data";

const entries = [
  { href: "/finance/dashboard", title: "Panel Financiero", description: "Control de avance, actividad y acciones rapidas para seguir tu plan." },
  { href: "/finance/simulators", title: "Simuladores", description: "Escenarios interactivos con resultados y graficos para decidir mejor." },
  { href: "/finance/calculator", title: "Calculadora", description: "Herramienta rapida para ahorro, aportes, tiempo y rentabilidad." },
  { href: "/finance/guides", title: "Guias", description: "Contenido micro para entender conceptos sin ruido." },
  { href: "/finance/optimizer", title: "Optimizador", description: "Sugerencias de ajuste de cartera por objetivo y volatilidad." },
  { href: "/finance/analyzer", title: "Analizador", description: "Lectura de riesgo, correlacion y consistencia de estrategia." },
  { href: "/finance/market-values", title: "Valores de Mercado", description: "Ticker en vivo visual y resumen de referencia del mercado." }
];

export default function FinanceHomePage() {
  return (
    <FinanceShell
      title="Zyvola Finanzas"
      subtitle="Home central para decidir, simular y mejorar cada paso de tu sistema financiero personal."
    >
      <section className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PremiumCard title="Punto de control diario" icon="HQ">
          <p className="mb-4 text-sm text-zinc-300">
            Arranca por el panel, valida tu escenario en simuladores y ejecuta una accion concreta hoy.
          </p>
          <div className="flex flex-wrap gap-2">
            <FinanceCTA href="/finance/dashboard">Abrir Panel</FinanceCTA>
            <FinanceCTA href="/finance/simulators" variant="ghost">Ir a Simuladores</FinanceCTA>
            <FinanceCTA href="/finance/market-values" variant="ghost">Ver Mercado</FinanceCTA>
          </div>
        </PremiumCard>
        <PremiumCard title="Estado de modulo" icon="ST">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Modo</p>
              <p className="mt-1 text-sm text-zinc-100">Aprender + ejecutar</p>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Flujo</p>
              <p className="mt-1 text-sm text-zinc-100">Panel → Simular → Ajustar</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FinanceBadge tone="gold">Premium Hub</FinanceBadge>
            <FinanceBadge tone="neutral">Datos claros</FinanceBadge>
          </div>
        </PremiumCard>
      </section>

      <section className="mb-6">
        <FinanceSectionHeader
          title="Valores de mercado"
          subtitle="Ticker horizontal con activos de referencia para lectura rapida del contexto." 
          action={<Link href="/finance/market-values" className="text-xs uppercase tracking-[0.16em] text-[#D4AF37]">Abrir modulo</Link>}
        />
        <FinanceMarketTicker items={marketTickerData} />
      </section>

      <section>
        <FinanceSectionHeader
          title="Modulos principales"
          subtitle="Estructura completa de Finance en el orden de trabajo recomendado." 
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <PremiumCard
            key={entry.href}
            title={entry.title}
            icon="FN"
            footer={
              <Link
                href={entry.href}
                className="inline-flex rounded-md border border-[#D4AF37]/45 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#F3D67F] transition hover:bg-[#D4AF37]/10"
              >
                Abrir
              </Link>
            }
          >
            {entry.description}
          </PremiumCard>
        ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <PremiumCard title="Plan base semanal" icon="PL">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Revisar panel cada lunes</li>
            <li>Ejecutar 2 simulaciones por semana</li>
            <li>Aplicar 1 mejora en optimizador</li>
          </ul>
        </PremiumCard>
        <PremiumCard title="Regla de claridad" icon="RC">
          <p>Si una decision no se puede explicar en 30 segundos, vuelve a simuladores y analizador.</p>
        </PremiumCard>
        <PremiumCard title="Siguiente accion" icon="NX" footer={<FinanceCTA href="/finance/calculator">Abrir calculadora</FinanceCTA>}>
          Valida un objetivo real de ahorro y define hoy mismo el numero exacto de aporte mensual.
        </PremiumCard>
      </section>
    </FinanceShell>
  );
}
