"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FinanceNav, financeNavItems } from "@/components/finance/FinanceNav";
import { FinanceDivider } from "@/components/finance/ui/FinanceDivider";

const labels: Record<string, string> = {
  finance: "Finanzas",
  "market-values": "Valores de mercado",
  analyzer: "Analizador",
  optimizer: "Optimizador",
  calculator: "Calculadora",
  panel: "Panel",
  dashboard: "Resumen",
  simulators: "Simuladores",
  collections: "Temas",
  challenges: "Retos",
  guides: "Guias",
  "assets-explorer": "Activos",
  "compound-interest": "Interes compuesto",
  "monthly-investment": "Inversion mensual",
  inflation: "Inflacion",
  mortgage: "Hipoteca",
  "opportunity-cost": "Si no inviertes",
  fire: "Meta FIRE"
};

export function FinanceFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => ({
      label: labels[part] || part,
      href: `/${parts.slice(0, index + 1).join("/")}`
    }));
  }, [pathname]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-[#D4AF37]/20 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link href="/finance" className="text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
              Zyvola Finanzas
            </Link>
            <span className="rounded-md border border-[#D4AF37]/30 px-2 py-1 text-xs text-zinc-300">
              {financeNavItems.length} Secciones
            </span>
          </div>
          <FinanceNav />
          <div className="mt-4">
            <FinanceDivider />
          </div>
          <nav className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400" aria-label="Breadcrumb">
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="inline-flex items-center gap-2">
                {index < crumbs.length - 1 ? (
                  <Link className="hover:text-zinc-100" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#F3D67F]">{crumb.label}</span>
                )}
                {index < crumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>{children}</main>
    </div>
  );
}
