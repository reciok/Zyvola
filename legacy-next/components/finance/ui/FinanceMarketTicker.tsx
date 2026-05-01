import { MarketTickerItem } from "@/lib/finance/types";
import { FinanceSparkline } from "@/components/finance/ui/FinanceSparkline";

interface FinanceMarketTickerProps {
  items: MarketTickerItem[];
}

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

export function FinanceMarketTicker({ items }: FinanceMarketTickerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-black/70">
      <div className="overflow-x-auto px-3 py-3">
        <div className="inline-flex min-w-full gap-3">
          {items.map((item) => {
            const positive = item.changePct >= 0;
            return (
              <article
                key={item.symbol}
                className="w-[260px] rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 align-top"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-100">{item.symbol}</p>
                  <p className={`text-xs ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                    {positive ? "+" : ""}
                    {item.changePct.toFixed(2)}%
                  </p>
                </div>
                <p className="text-xs text-zinc-400">{item.name}</p>
                <p className="mt-2 text-lg font-semibold text-[#F3D67F]">{currency.format(item.price)}</p>
                <p className="text-xs text-zinc-500">
                  Rango: {currency.format(item.dayRange[0])} - {currency.format(item.dayRange[1])}
                </p>
                <div className="mt-2">
                  <FinanceSparkline values={item.sparkline} positive={positive} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
