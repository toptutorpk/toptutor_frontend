import { cn } from '@/lib/utils';

/**
 * The "Ask TopTutor" robot.
 *
 * <p>Drawn rather than shipped as artwork. The mascot has to sit on three different grounds — the
 * blue launcher, the ink launcher and the white panel header — at sizes from 20px to 44px, and it
 * has to blink. A raster asset would need a file per ground, would soften at 2x, and could not be
 * animated; as vector it is one component that inherits its palette from props and stays crisp.
 *
 * <p>The three motions — a slow bob, a periodic blink and the antenna's pulse — are CSS, defined
 * next to the other keyframes in globals.css and switched off under `prefers-reduced-motion`.
 * Together they are what makes the launcher read as waiting rather than as a static badge.
 */
export function AssistantMascot({
  className,
  animated = true,
  glow = true,
}: {
  className?: string;
  /** Off for decorative copies (the message avatar), where two blinking robots would compete. */
  animated?: boolean;
  /** The soft bloom behind the antenna dot and the eyes. Reads as light; costs a filter. */
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0 overflow-visible', className)}
    >
      <defs>
        {/* The head reads as a moulded plastic shell: lit from above, cooling to blue at the jaw. */}
        <linearGradient id="tt-head" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eaf1fd" />
          <stop offset="100%" stopColor="#bed2f1" />
        </linearGradient>
        <linearGradient id="tt-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d3e1f8" />
          <stop offset="100%" stopColor="#9fbdea" />
        </linearGradient>
        {/* Near-black rather than black: a true #000 visor looks like a hole punched in the head. */}
        <linearGradient id="tt-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16233c" />
          <stop offset="100%" stopColor="#060c18" />
        </linearGradient>
        {glow && (
          <filter id="tt-bloom" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g className={animated ? 'tt-mascot-bob' : undefined}>
        {/* Antenna. The stalk is drawn first so the dot's bloom sits over its tip. */}
        <rect x="30.7" y="7.2" width="2.6" height="9.4" rx="1.3" fill="#cfdff7" />
        <circle
          cx="32"
          cy="5"
          r="3.4"
          fill="#38bdf8"
          filter={glow ? 'url(#tt-bloom)' : undefined}
          className={animated ? 'tt-mascot-spark' : undefined}
        />

        {/* Ears, behind the head so the shell overlaps them at the temples. */}
        <rect x="2.6" y="27" width="6.2" height="16.4" rx="3.1" fill="url(#tt-ear)" />
        <rect x="55.2" y="27" width="6.2" height="16.4" rx="3.1" fill="url(#tt-ear)" />

        {/* Chin nub, peeking below the jaw. */}
        <rect x="29.4" y="57.5" width="5.2" height="4.4" rx="2.2" fill="#c3d5f2" />

        <rect x="8" y="15" width="48" height="45" rx="15" fill="url(#tt-head)" />
        {/* A single specular sweep across the brow — the whole reason the shell reads as glossy. */}
        <rect x="13" y="18.5" width="30" height="6" rx="3" fill="#ffffff" opacity="0.65" />

        <rect x="14.5" y="29.5" width="35" height="18" rx="8.6" fill="url(#tt-visor)" />

        <g filter={glow ? 'url(#tt-bloom)' : undefined}>
          <rect
            x="21.6"
            y="34.6"
            width="5"
            height="7.8"
            rx="2.5"
            fill="#7dd3fc"
            className={animated ? 'tt-mascot-eye' : undefined}
          />
          <rect
            x="37.4"
            y="34.6"
            width="5"
            height="7.8"
            rx="2.5"
            fill="#7dd3fc"
            className={animated ? 'tt-mascot-eye' : undefined}
          />
        </g>
      </g>
    </svg>
  );
}
