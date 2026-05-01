import { ReactNode } from "react";
import { FinanceCard } from "@/components/finance/ui/FinanceCard";

interface PremiumCardProps {
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function PremiumCard({ title, icon = "ZX", children, footer }: PremiumCardProps) {
  return <FinanceCard title={title} icon={icon} footer={footer}>{children}</FinanceCard>;
}
