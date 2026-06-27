import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string; // e.g. "5,000+", "4.8 / 5", "180k+"
  duration?: number;
  className?: string;
}

/** Animates the leading numeric portion of a label from 0 to its target. */
export function AnimatedCounter({ value, duration = 1600, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(value);

  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? 1 : 0;

  useEffect(() => {
    if (!inView || target === null) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      const formatted =
        decimals > 0
          ? current.toFixed(1)
          : Math.round(current).toLocaleString('en-US');
      setDisplay(formatted + suffix);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, suffix, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {target === null ? value : display}
    </span>
  );
}
