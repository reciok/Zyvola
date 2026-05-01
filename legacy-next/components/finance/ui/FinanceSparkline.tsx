interface FinanceSparklineProps {
  values: number[];
  positive?: boolean;
}

export function FinanceSparkline({ values, positive = true }: FinanceSparklineProps) {
  if (!values.length) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1 || 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-12 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#D4AF37" : "#a85555"}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
