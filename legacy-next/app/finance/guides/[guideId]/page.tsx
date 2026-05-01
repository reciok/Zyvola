import { notFound } from "next/navigation";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceLineChart } from "@/components/finance/FinanceLineChart";
import { FinanceBadge } from "@/components/finance/ui/FinanceBadge";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinancePanel } from "@/components/finance/ui/FinancePanel";
import { financeGuides } from "@/lib/finance/data";

export default function GuideDetailPage({ params }: { params: { guideId: string } }) {
  const guide = financeGuides.find((item) => item.id === params.guideId);
  if (!guide) return notFound();

  const chartData = [
    { year: "1", value: 20 },
    { year: "2", value: 35 },
    { year: "3", value: 48 },
    { year: "4", value: 61 },
    { year: "5", value: 78 }
  ];

  return (
    <FinanceShell
      title={guide.title}
      subtitle="Explicacion visual corta para conectar concepto y accion en menos de un minuto."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <FinanceCTA href="/finance/guides" variant="ghost">Volver a guias</FinanceCTA>
        <FinanceCTA href={`/finance/simulators/${guide.ctaSimulator}`}>Simular esto</FinanceCTA>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <FinancePanel>
          <p className="mb-3 text-sm uppercase tracking-[0.14em] text-[#D4AF37]">Explicacion</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
            {guide.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <FinanceBadge tone="gold">30-60 segundos</FinanceBadge>
            <FinanceBadge tone="neutral">Educativo</FinanceBadge>
          </div>
        </FinancePanel>

        <FinancePanel>
          <p className="mb-3 text-sm uppercase tracking-[0.14em] text-[#D4AF37]">Visualizacion</p>
          <FinanceLineChart data={chartData} xKey="year" yKey="value" />
          <p className="mt-3 text-xs text-zinc-400">{guide.chartLabel}</p>
        </FinancePanel>
      </div>
    </FinanceShell>
  );
}
