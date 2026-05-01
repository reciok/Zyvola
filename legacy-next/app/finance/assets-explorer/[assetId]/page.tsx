import { notFound } from "next/navigation";
import Link from "next/link";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinancePanel } from "@/components/finance/ui/FinancePanel";
import { assetsData } from "@/lib/finance/data";

export default function AssetDetailPage({ params }: { params: { assetId: string } }) {
  const asset = assetsData.find((item) => item.id === params.assetId);
  if (!asset) return notFound();

  const chartData = [
    { year: "1", value: 30 },
    { year: "2", value: 38 },
    { year: "3", value: 34 },
    { year: "4", value: 44 },
    { year: "5", value: 52 }
  ];

  return (
    <FinanceShell
      title={asset.name}
      subtitle="Ficha educativa premium para entender objetivo, riesgos y aplicacion en cartera."
    >
      <div className="mb-4">
        <FinanceCTA href="/finance/assets-explorer" variant="ghost">Volver al explorador</FinanceCTA>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <FinancePanel>
          <div className="mb-4 flex flex-wrap gap-2">
            <FinanceBadge tone="gold">{asset.category}</FinanceBadge>
            <FinanceBadge tone="neutral">Informativo</FinanceBadge>
          </div>
          <div className="space-y-3 text-sm text-zinc-300">
            <p><span className="text-[#D4AF37]">Que es:</span> {asset.category}</p>
            <p><span className="text-[#D4AF37]">Por que existe:</span> {asset.whyExists}</p>
            <p><span className="text-[#D4AF37]">Riesgos:</span> {asset.risks}</p>
            <p><span className="text-[#D4AF37]">Uso en cartera:</span> {asset.portfolioUse}</p>
          </div>
        </FinancePanel>

        <FinancePanel>
          <p className="mb-3 text-sm uppercase tracking-[0.14em] text-[#D4AF37]">Grafico simple</p>
          <FinanceLineChart data={chartData} xKey="year" yKey="value" />
          <div className="mt-4 flex flex-wrap gap-2">
            {asset.relatedSimulators.map((slug) => (
              <Link key={slug} href={`/finance/simulators/${slug}`} className="text-xs text-zinc-300 underline-offset-4 hover:text-zinc-100 hover:underline">
                Simular impacto
              </Link>
            ))}
          </div>
        </FinancePanel>
      </div>
    </FinanceShell>
  );
}
