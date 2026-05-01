import Link from "next/link";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { assetsData } from "@/lib/finance/data";

export default function FinanceAssetsExplorerPage() {
  return (
    <FinanceShell
      title="Explorador de activos"
      subtitle="Fichas educativas para entender funcion, riesgos y uso estrategico en cartera."
    >
      <FinanceSectionHeader
        title="Activos informativos"
        subtitle="Explora funcion, riesgo y aplicacion de cada activo dentro de una cartera modular."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {assetsData.map((asset) => (
          <FinanceCard
            key={asset.id}
            title={asset.name}
            icon={asset.category.slice(0, 2).toUpperCase()}
            footer={
              <div className="flex flex-wrap gap-2">
                <FinanceBadge tone="neutral">{asset.category}</FinanceBadge>
                <FinanceCTA href={`/finance/assets-explorer/${asset.id}`} variant="ghost">Ver ficha</FinanceCTA>
                {asset.relatedSimulators.map((slug) => (
                  <Link key={slug} href={`/finance/simulators/${slug}`} className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-100 hover:underline">
                    Simular impacto
                  </Link>
                ))}
              </div>
            }
          >
            <div className="space-y-2">
              <p><span className="text-[#D4AF37]">Que es:</span> {asset.category}</p>
              <p><span className="text-[#D4AF37]">Por que existe:</span> {asset.whyExists}</p>
              <p><span className="text-[#D4AF37]">Riesgos:</span> {asset.risks}</p>
              <p><span className="text-[#D4AF37]">Uso en cartera:</span> {asset.portfolioUse}</p>
            </div>
          </FinanceCard>
        ))}
      </div>
    </FinanceShell>
  );
}
