interface FinanceProgressBarProps {
  value: number;
  label?: string;
}

export function FinanceProgressBar({ value, label }: FinanceProgressBarProps) {
  return (
    <div className="space-y-2">
      {label ? <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{label}</p> : null}
      <div className="h-2.5 w-full rounded-full bg-zinc-800">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3D67F] transition-all duration-500"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500">{value}%</p>
    </div>
  );
}
