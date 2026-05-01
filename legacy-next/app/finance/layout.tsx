import { ReactNode } from "react";
import { FinanceFrame } from "@/components/finance/FinanceFrame";

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <FinanceFrame>{children}</FinanceFrame>;
}
