import { FinanceShell } from "@/components/finance/FinanceShell";
import { DashboardClient } from "./DashboardClient";

export default function FinanceDashboardPage() {
  return (
    <FinanceShell
      title="Resumen financiero"
      subtitle="Tu panel para ver progreso, aprendizaje y siguientes pasos."
    >
      <DashboardClient />
    </FinanceShell>
  );
}
