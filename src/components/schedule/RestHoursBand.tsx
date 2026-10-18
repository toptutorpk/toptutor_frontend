import { motion, useReducedMotion } from 'framer-motion';
import { Moon } from 'lucide-react';
import { LottieAnimation } from '@/components/animations/LottieAnimation';
import { cn } from '@/lib/utils';

/**
 * Drop a Lottie JSON here and the band plays it instead of the drawn moon — no code change needed.
 * Left undefined until the asset exists, which is what `LottieAnimation` is built for.
 */
const REST_LOTTIE: string | undefined = undefined;

/** Below this the band is a sliver; a label in it would be unreadable, so it stays blur-only. */
const LABEL_MIN_PX = 96;
/** And below this there is no room for the illustration either. */
const ART_MIN_PX = 170;

/**
 * The blurred overlay across hours nobody may be taught in.
 *
 * <p>TopTutor sells 06:00–23:30 only, so any hour the grid draws outside that is not merely empty —
 * it is closed. Blurring says that at a glance, where an empty column would just look like free
 * time nobody has booked yet.
 *
 * <p>Sized in pixels by the caller rather than by time, because the grid's own top edge moves: it
 * stretches to reach the current moment, so the closed band above 06:00 exists only when someone is
 * looking at the calendar in the small hours — which is exactly when the message is worth showing.
 */
export function RestHoursBand({
  top,
  height,
  label,
}: {
  top: number;
  height: number;
  label: string;
}) {
  if (height <= 0) return null;

  return (
    <div
      // pointer-events-none: the band is a statement, not a shield. Entries underneath it stay
      // clickable, which matters for a session that was booked before the hours narrowed.
      className="pointer-events-none absolute inset-x-0 z-10 overflow-hidden"
      style={{ top, height }}
      aria-hidden
    >
      {/* Two layers: the blur veils whatever is behind, the wash tints it as "off". Backdrop-blur
          alone leaves the hour lines crisp enough to read as ordinary empty time. */}
      <div className="absolute inset-0 bg-secondary/45 backdrop-blur-[2px] dark:bg-background/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/40 to-transparent dark:from-brand-500/5" />

      {height >= LABEL_MIN_PX && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
          {height >= ART_MIN_PX && (
            <LottieAnimation
              className="h-20 w-20"
              src={REST_LOTTIE}
              fallback={<SleepingMoon />}
              aria-label="Rest hours"
            />
          )}
          <p className="text-sm font-semibold text-foreground/80">Rest time</p>
          <p className="max-w-[15rem] text-xs leading-relaxed text-muted-foreground">{label}</p>
        </div>
      )}
    </div>
  );
}

/**
 * The end-of-day rest zone, below the last hour of the grid.
 *
 * <p>Exists because the closed part of the evening is only 23:30–24:00 — half an hour, thirty-two
 * pixels — and no illustration or sentence fits in that. Overlaying it there technically marked the
 * hours while communicating nothing, so the message gets its own space instead, and scrolling past
 * 11 PM now arrives somewhere rather than stopping at a tinted sliver.
 *
 * <p>A block in the scroll flow rather than an absolute overlay: it has to ADD height to the
 * scroller, which is what makes it reachable.
 */
export function RestHoursPanel({ label }: { label: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 border-t bg-gradient-to-b from-secondary/50 to-brand-50/30 px-4 py-8 text-center dark:from-background/60 dark:to-brand-500/5">
      <LottieAnimation
        className="h-24 w-24"
        src={REST_LOTTIE}
        fallback={<SleepingMoon />}
        aria-label="Rest hours"
      />
      <p className="font-display text-base font-bold text-foreground/85">Rest time</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * The stand-in until a Lottie is dropped in: a moon breathing slowly, with two drifting z's.
 *
 * <p>Deliberately slow. This sits on a page a tutor may leave open, and the whole message is
 * "nothing is happening now" — a brisk animation would contradict the thing it is illustrating.
 */
function SleepingMoon() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <Moon className="h-7 w-7" />
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className={cn(
            'absolute font-display font-bold text-brand-400/70 dark:text-brand-300/60',
            i === 0 ? 'text-sm' : 'text-xs',
          )}
          style={{ left: `${58 + i * 12}%`, top: '22%' }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], y: -18 }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 1.6, ease: 'easeOut' }}
        >
          z
        </motion.span>
      ))}
      <motion.span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Moon className="h-7 w-7" />
      </motion.span>
    </div>
  );
}
