import Link from "next/link";
import { ReactNode } from "react";

interface FinanceCTAProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "gold" | "ghost";
}

const styles = {
  gold: "border-[#D4AF37]/50 text-[#F3D67F] hover:bg-[#D4AF37]/10",
  ghost: "border-zinc-700 text-zinc-200 hover:bg-zinc-900"
};

export function FinanceCTA({ href, onClick, children, variant = "gold" }: FinanceCTAProps) {
  const className = `inline-flex items-center rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${styles[variant]}`;

  if (href) return <Link href={href} className={className}>{children}</Link>;

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
}
