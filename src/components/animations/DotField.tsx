import { useEffect, useRef, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';

/**
 * Dot-lattice background with a few sparks travelling along its rows/columns.
 *
 * `clearOf` takes the element holding the band's copy. Its box is measured and
 * punched out of the layer's mask, so the lattice only ever shows in the empty
 * space around the text — no manual coordinates to keep in sync when the copy
 * or the breakpoint changes.
 */

interface Spark {
  /** Lattice indices — the spark is placed on the dot at this row/column. */
  row: number;
  col: number;
  /** How many cells it travels before fading out. */
  span: number;
  axis: 'x' | 'y';
  delay: number;
  tone: 'brand' | 'gold';
}

/**
 * Pixels per second. Duration is derived from this and the spark's span, so a
 * spark crossing 14 cells takes twice as long as one crossing 7 and they all
 * drift at the same apparent speed. Lower = calmer.
 */
const SPARK_SPEED = 15;

const SPARKS: Spark[] = [
  { row: 2, col: 1, span: 11, axis: 'x', delay: 0, tone: 'brand' },
  { row: 7, col: 3, span: 8, axis: 'x', delay: 3, tone: 'gold' },
  { row: 11, col: 2, span: 14, axis: 'x', delay: 7, tone: 'brand' },
  { row: 1, col: 14, span: 9, axis: 'y', delay: 1.5, tone: 'brand' },
  { row: 3, col: 22, span: 7, axis: 'y', delay: 5.5, tone: 'gold' },
  { row: 14, col: 18, span: 10, axis: 'x', delay: 9, tone: 'brand' },
];

const SPARK_COLORS = {
  light: { brand: '#2563eb', gold: '#f59e0b' },
  dark: { brand: '#bfdbfe', gold: '#fcd34d' },
} as const;

const SPARK_SIZE = 5;

interface Hole {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export function DotField({
  className,
  tone = 'light',
  gap = 28,
  clearOf,
}: {
  className?: string;
  /** `dark` switches the lattice and sparks to light-on-navy. */
  tone?: 'light' | 'dark';
  /** Lattice spacing in px. */
  gap?: number;
  /** Element to keep dot-free — typically the band's copy column. */
  clearOf?: RefObject<HTMLElement | null>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hole, setHole] = useState<Hole | null>(null);
  const colors = SPARK_COLORS[tone];

  // Measure the copy block relative to this layer. Both boxes come from
  // getBoundingClientRect, so the two elements do not need to be siblings.
  useEffect(() => {
    const target = clearOf?.current;
    const host = hostRef.current;
    if (!target || !host) return;

    const update = () => {
      const h = host.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      if (!h.width || !t.width) return;
      setHole({
        cx: t.left - h.left + t.width / 2,
        cy: t.top - h.top + t.height / 2,
        // Padding so the fade starts clear of the glyphs themselves.
        rx: t.width / 2 + 40,
        ry: t.height / 2 + 28,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    observer.observe(target);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [clearOf]);

  // Transparent over the copy, opaque beyond it — the dots fade out rather
  // than stopping at a hard edge.
  const holeMask = hole
    ? `radial-gradient(ellipse ${hole.rx}px ${hole.ry}px at ${hole.cx}px ${hole.cy}px,` +
      ' transparent 0%, transparent 58%, black 100%)'
    : undefined;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ maskImage: holeMask, WebkitMaskImage: holeMask }}
    >
      <div
        className="absolute inset-0 bg-dots"
        style={
          {
            '--dot-gap': `${gap}px`,
            '--dot-color': tone === 'dark' ? 'rgb(255 255 255 / 0.28)' : undefined,
          } as React.CSSProperties
        }
      />

      {SPARKS.map((spark, i) => {
        const travel = spark.span * gap;
        return (
          <span
            key={i}
            className={cn('dot-spark absolute rounded-full', spark.axis === 'y' && 'dot-spark-y')}
            style={
              {
                // Lattice points sit at (n + 0.5) * gap; offset by half the
                // spark so it is centred on the dot it replaces.
                left: (spark.col + 0.5) * gap - SPARK_SIZE / 2,
                top: (spark.row + 0.5) * gap - SPARK_SIZE / 2,
                width: SPARK_SIZE,
                height: SPARK_SIZE,
                backgroundColor: colors[spark.tone],
                boxShadow: `0 0 8px 2px ${colors[spark.tone]}`,
                '--dot-travel': `${travel}px`,
                '--dot-duration': `${(travel / SPARK_SPEED).toFixed(2)}s`,
                '--dot-delay': `${spark.delay}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
