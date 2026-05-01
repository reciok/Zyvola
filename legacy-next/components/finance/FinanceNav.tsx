import Link from "next/link";
import { FinanceCTA } from "@/components/finance/ui/FinanceCTA";

export const financeNavItems = [
  { href: "/finance", label: "Home" },
  { href: "/finance/dashboard", label: "Panel" },
  { href: "/finance/simulators", label: "Simuladores" },
  { href: "/finance/calculator", label: "Calculadora" },
  { href: "/finance/guides", label: "Guias" },
  { href: "/finance/optimizer", label: "Optimizador" },
  { href: "/finance/analyzer", label: "Analizador" },
  { href: "/finance/market-values", label: "Valores" }
];

export function FinanceNav() {
  return (
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
      {financeNavItems.map((item) => (
        <FinanceCTA key={item.href} href={item.href}>
          {item.label}
        </FinanceCTA>
      ))}
    </nav>
  );
}
