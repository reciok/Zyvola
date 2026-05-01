export function currency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function percent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function financialLevel(score: number): string {
  if (score >= 80) return "Nivel Oro";
  if (score >= 55) return "Nivel Plata";
  return "Nivel Base";
}
