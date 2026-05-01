import { ReactNode } from "react";

interface FinanceGridProps {
  children: ReactNode;
  cols?: "2" | "3" | "4";
}

const colClasses = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-2 xl:grid-cols-3",
  "4": "sm:grid-cols-2 xl:grid-cols-4"
};

export function FinanceGrid({ children, cols = "3" }: FinanceGridProps) {
  return <div className={`grid gap-4 ${colClasses[cols]}`}>{children}</div>;
}
