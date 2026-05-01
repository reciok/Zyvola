import Link from "next/link";
import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";
import { FinanceGrid } from "@/components/finance/ui/FinanceGrid";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { financeCollections } from "@/lib/finance/data";

export default function FinanceCollectionsPage() {
  return (
    <FinanceShell
      title="Colecciones financieras"
      subtitle="Rutas de conocimiento agrupadas por objetivos y estilo de decision."
    >
      <FinanceSectionHeader
        title="Sistema coleccionable"
        subtitle="Cada coleccion conecta aprendizaje, simulacion y ejecucion en una estructura modular."
      />
      <FinanceGrid cols="2">
        {financeCollections.map((collection) => (
          <FinanceCard
            key={collection.id}
            title={collection.title}
            icon={collection.icon}
            footer={
              <div className="flex flex-wrap gap-2">
                <FinanceCTA href={`/finance/collections#${collection.id}`}>Explorar</FinanceCTA>
                {collection.relatedSimulators.map((slug) => (
                  <Link key={slug} href={`/finance/simulators/${slug}`} className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
                    Simulador relacionado
                  </Link>
                ))}
              </div>
            }
          >
            {collection.description}
          </FinanceCard>
        ))}
      </FinanceGrid>
    </FinanceShell>
  );
}
