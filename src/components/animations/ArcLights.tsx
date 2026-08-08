import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Decorative arc network for full-bleed hero bands.
 *
 * Two families of very large concentric circles cross the canvas; a short
 * bright segment travels along a few of them. Because each streak is a dash on
 * the circle itself (`stroke-dasharray: streak circumference`), advancing the
 * offset by one circumference walks it around exactly once — no path maths, and
 * the browser animates it off the main thread.
 *
 * Most of every circle sits outside the viewBox, so a streak reads as a light
 * entering one edge, sweeping across, and leaving by the other.
 */

interface Arc {
  cx: number;
  cy: number;
  r: number;
  /** Omit to draw a static arc with no travelling light. */
  streak?: {
    /** Arc length of the bright segment, in viewBox units. */
    length: number;
    /** Seconds for one full lap. */
    duration: number;
    delay: number;
    tone: 'brand' | 'gold';
  };
}

const VIEW_W = 1440;
const VIEW_H = 720;

/**
 * Family A bows across the band from a centre below the canvas; family B sweeps
 * the top-right from a centre above it. The two sets crossing is what gives the
 * pattern its depth.
 */
const ARCS: Arc[] = [
  // ---- Family A — centre below the canvas -------------------------------
  { cx: 620, cy: 1220, r: 1150, streak: { length: 260, duration: 14, delay: 0, tone: 'gold' } },
  { cx: 620, cy: 1220, r: 1000 },
  { cx: 620, cy: 1220, r: 850, streak: { length: 200, duration: 18, delay: 3.5, tone: 'brand' } },
  { cx: 620, cy: 1220, r: 700 },

  // ---- Family B — centre above the canvas, sweeping right ---------------
  { cx: 1560, cy: -140, r: 1000, streak: { length: 220, duration: 16, delay: 6, tone: 'brand' } },
  { cx: 1560, cy: -140, r: 800 },
  { cx: 1560, cy: -140, r: 600, streak: { length: 150, duration: 11, delay: 1.5, tone: 'gold' } },
];

const STREAK_COLORS = {
  light: { brand: '#2563eb', gold: '#f59e0b' },
  dark: { brand: '#93c5fd', gold: '#fbbf24' },
} as const;

export function ArcLights({
  className,
  tone = 'light',
}: {
  className?: string;
  /** `dark` brightens the arcs for navy bands. */
  tone?: 'light' | 'dark';
}) {
  // Scoped so the component can appear more than once on a page without its
  // <defs> ids colliding.
  const uid = useId().replace(/:/g, '');
  const fadeId = `arc-fade-${uid}`;
  const maskId = `arc-mask-${uid}`;
  const glowId = `arc-glow-${uid}`;
  const colors = STREAK_COLORS[tone];

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      role="presentation"
      className={cn(
        'pointer-events-none h-full w-full',
        tone === 'dark' ? 'text-white/20' : 'text-brand-500/30 dark:text-brand-400/25',
        className,
      )}
    >
      <defs>
        {/* Arcs dissolve toward the edges so they never collide with the frame. */}
        <radialGradient id={fadeId} cx="50%" cy="48%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={maskId}>
          <rect width={VIEW_W} height={VIEW_H} fill={`url(#${fadeId})`} />
        </mask>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g mask={`url(#${maskId})`}>
        {ARCS.map((arc) => (
          <circle
            key={`base-${arc.cx}-${arc.r}`}
            cx={arc.cx}
            cy={arc.cy}
            r={arc.r}
            stroke="currentColor"
            strokeWidth={1}
          />
        ))}

        {ARCS.filter((arc) => arc.streak).map((arc) => {
          const { length, duration, delay, tone: streakTone } = arc.streak!;
          const circumference = 2 * Math.PI * arc.r;
          return (
            <circle
              key={`streak-${arc.cx}-${arc.r}`}
              className="arc-streak"
              cx={arc.cx}
              cy={arc.cy}
              r={arc.r}
              stroke={colors[streakTone]}
              strokeWidth={2.5}
              strokeLinecap="round"
              // dash + gap must sum to exactly the circumference: the pattern
              // then tiles the circle once, so there is no seam at the path
              // start and advancing the offset by one circumference returns to
              // an identical frame — a perfectly seamless loop.
              strokeDasharray={`${length} ${circumference - length}`}
              filter={`url(#${glowId})`}
              style={
                {
                  '--arc-circumference': String(circumference),
                  '--arc-duration': `${duration}s`,
                  '--arc-delay': `${delay}s`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </g>
    </svg>
  );
}
