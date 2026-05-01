interface FinanceIconProps {
  label: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm"
};

export function FinanceIcon({ label, size = "md" }: FinanceIconProps) {
  return (
    <span
      className={`inline-flex ${sizeClasses[size]} items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 font-semibold uppercase tracking-[0.12em] text-[#F3D67F]`}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
