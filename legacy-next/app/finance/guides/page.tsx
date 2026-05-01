import { FinanceShell } from "@/components/finance/FinanceShell";
import { FinanceSectionHeader } from "@/components/finance/ui/FinanceSectionHeader";
import { GuidesClient } from "./GuidesClient";

export default function FinanceGuidesPage() {
  return (
    <FinanceShell
      title="Mini-guias educativas"
      subtitle="Micro-contenido de alto impacto para comprender conceptos en menos de un minuto."
    >
      <FinanceSectionHeader title="Aprendizaje express" subtitle="Cada guia conecta teoria, visual rapido y accion inmediata." />
      <GuidesClient />
    </FinanceShell>
  );
}
