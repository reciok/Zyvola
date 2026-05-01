"use client";

import { useEffect, useState } from "react";

interface FinanceAnimatedNumberProps {
  value: number;
  suffix?: string;
}

export function FinanceAnimatedNumber({ value, suffix = "" }: FinanceAnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 550;

    const loop = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{display}{suffix}</span>;
}
