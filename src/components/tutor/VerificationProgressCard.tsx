import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LottieAnimation } from '@/components/animations/LottieAnimation';
import { verificationService, type VerificationStep } from '@/services/verificationService';
import { cn } from '@/lib/utils';

/**
 * Drop a Lottie JSON at this path and the verified state plays it instead of the static badge —
 * no code change needed. Left undefined until the asset exists, which is what `LottieAnimation`
 * is built for.
 *
 * <p>Only the *verified* state is wired this way. The in-progress ring is not decoration — it is
 * the reading of how far along the tutor is — so replacing it with a generic animation would cost
 * the card the one thing it is there to say.
 */
const VERIFIED_LOTTIE: string | undefined = undefined;

/**
 * The Verification card on the tutor's Analytics page.
 *
 * <p>Two genuinely different jobs, so two designs. Mid-verification the card has to *move someone
 * along*: how far, what is next, one button. Once verified it has to *reassure*: the badge is live
 * and students can find them. A single progress bar served neither well.
 */
export function VerificationProgressCard({
  verifiedSteps,
  totalSteps,
}: {
  verifiedSteps: number;
  totalSteps: number;
}) {
  // The counts come from the analytics call, which is already loaded — this second query only adds
  // the step *names*, so the card renders fully before it resolves rather than waiting on it.
  const { data } = useQuery({
    queryKey: ['verification'],
    queryFn: verificationService.get,
    staleTime: 5 * 60 * 1000,
  });

  const pct = totalSteps === 0 ? 0 : Math.round((verifiedSteps / totalSteps) * 100);
  const verified = totalSteps > 0 && verifiedSteps === totalSteps;
  const nextStep = data ? findNextStep(data.steps) : undefined;
  const awaitingReview = data?.steps.some((s) => s.status === 'UNDER_REVIEW') ?? false;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-6 shadow-soft',
        verified
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-card to-card dark:border-emerald-500/25 dark:from-emerald-500/10'
          : 'bg-card',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            verified
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
          )}
        >
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold">Verification</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-5">
        {verified ? (
          <LottieAnimation
            className="h-32 w-32"
            src={VERIFIED_LOTTIE}
            fallback={<VerifiedBadge />}
            aria-label="Your profile is verified"
          />
        ) : (
          <ProgressRing pct={pct} done={verifiedSteps} total={totalSteps} />
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {verified
          ? 'Your Verified Badge is active — students can find and book you.'
          : awaitingReview
            ? 'Some steps are with our team. We’ll email you the moment they’re reviewed.'
            : 'Students can only find and book you once every step is approved.'}
      </p>

      {!verified && (
        <>
          {nextStep && (
            <p className="mt-3 truncate rounded-lg bg-secondary/50 px-3 py-2 text-center text-sm">
              <span className="text-muted-foreground">Next: </span>
              <span className="font-semibold">{nextStep.title}</span>
            </p>
          )}
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/dashboard/tutor/verification">
              Continue verification <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * The step to point the tutor at next.
 *
 * <p>Anything they can act on comes first — a rejected step is more urgent than an untouched one,
 * because it is blocking and they may not know. Steps already with a reviewer are skipped: naming
 * one as "next" would ask the tutor to do something they cannot do.
 */
function findNextStep(steps: VerificationStep[]): VerificationStep | undefined {
  const order = ['REJECTED', 'IN_PROGRESS', 'NOT_STARTED', 'READY', 'FLAGGED'];
  for (const status of order) {
    const match = steps.find((s) => s.status === status);
    if (match) return match;
  }
  return undefined;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular progress, animated from empty on mount so the number lands as an achievement. */
function ProgressRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const reduceMotion = useReducedMotion();
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="verification-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-600, #2563eb)" />
            <stop offset="100%" stopColor="var(--color-brand-400, #60a5fa)" />
          </linearGradient>
        </defs>
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-secondary"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#verification-ring)"
          strokeDasharray={CIRCUMFERENCE}
          // Starts empty and fills to the real value. With reduced motion it is simply drawn at
          // its final position — the information is in the arc, not in the movement.
          initial={{ strokeDashoffset: reduceMotion ? offset : CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold tabular-nums">{pct}%</span>
        <span className="text-xs text-muted-foreground">
          {done} of {total} steps
        </span>
      </div>
    </div>
  );
}

/**
 * The verified state's stand-in until a Lottie is dropped in.
 *
 * <p>Built exactly like the "Active now" presence dot (`OnlineDot` in TutorCard): a ring pings out
 * from behind a mark that never itself changes. That separation is the whole trick — animating the
 * green ground's opacity instead makes the brightness around the badge rise and fall, and the eye
 * reads that as the badge blinking rather than as a ring leaving it.
 *
 * <p>The badge lands once and then holds still. `animate-ping` doubles what it is applied to, so
 * the 64px ring reaches exactly the 128px box and never clips against the card edge.
 */
function VerifiedBadge() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* The soft green ground. Static — it is the surface the ring leaves from, not part of the
          animation. */}
      <span className="absolute h-24 w-24 rounded-full bg-emerald-400/15" />

      {/* The only thing that moves. Decorative, so it is simply dropped for reduced motion.
          `animate-ping` runs at 1s by default, which is right for a presence dot glanced at in a
          list but reads as agitated on a card someone sits in front of. Slowed to 3s so it breathes
          rather than blinks — the same animation, at a pace that suits where it lives. */}
      {!reduceMotion && (
        <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-emerald-400 opacity-60 [animation-duration:3s]" />
      )}

      {/* Completely static: fully opaque, above the ring, and never animated at all. The ring is
          the animation; the mark it leaves from holds still. */}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg">
        <BadgeCheck className="h-8 w-8" />
      </span>
    </div>
  );
}
