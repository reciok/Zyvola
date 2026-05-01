import { FinanceShell } from "@/components/finance/FinanceShell";
import { PremiumCard } from "@/components/finance/PremiumCard";
import { FinanceMarketTicker } from "@/components/finance/ui/FinanceMarketTicker";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { marketTickerData } from "@/lib/finance/data";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

export default function FinanceMarketValuesPage() {
  return (
    <FinanceShell
      title="Valores de mercado"
      subtitle="Lectura visual de activos clave para tomar contexto antes de actuar."
    >
      <FinanceSectionHeader
        title="Ticker horizontal"
        subtitle="Vista rapida de variacion diaria y rango operativo en un solo carril."
      />
      <FinanceMarketTicker items={marketTickerData} />

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketTickerData.map((item) => {
          const positive = item.changePct >= 0;
          return (
            <PremiumCard key={item.symbol} title={`${item.symbol} · ${item.name}`} icon="MV">
              <p className="text-2xl font-semibold text-[#F3D67F]">{currency.format(item.price)}</p>
              <p className={`mt-1 text-sm ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                {positive ? "+" : ""}
                {item.changePct.toFixed(2)}% hoy
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Rango diario: {currency.format(item.dayRange[0])} - {currency.format(item.dayRange[1])}
              </p>
            </PremiumCard>
          );
        })}
      </section>
    </FinanceShell>
  );
}
