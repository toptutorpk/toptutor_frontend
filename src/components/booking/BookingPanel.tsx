import { useState } from 'react';
import { Phone, ShieldCheck, Zap, Check, Loader2, Home } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { Tutor } from '@/types';
import { useBookIntro } from '@/hooks/useTutorContact';
import { isPublicTutor } from '@/services/tutorService';
import { BOOKING_PAYMENT_METHODS } from '@/constants/payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingFlow } from './BookingFlow';
import { PaymentMethodIcon, PaymentWordmark } from './PaymentMethodIcon';
import { isMethodAvailable } from './flow';

export function BookingPanel({ tutor, mode = 'ONLINE' }: { tutor: Tutor; mode?: 'ONLINE' | 'HOME' }) {
  const [selectedPkg, setSelectedPkg] = useState(tutor.packages[1]?.id ?? tutor.packages[0].id);
  const pkg = tutor.packages.find((p) => p.id === selectedPkg) ?? tutor.packages[0];
  const { book, loading: booking } = useBookIntro();

  // Mode is driven by the availability toggle above; home visit shows the monthly starting price.
  const homeVisit = mode === 'HOME';

  // Restated here even though the profile page already refuses to render an unverified tutor.
  // This is the component that takes payment, so it does not infer its right to do so from whoever
  // mounted it — a future surface that lists tutors without that check inherits the rule.
  if (!isPublicTutor(tutor)) {
    return (
      <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-soft">
        <p className="font-display font-bold text-foreground">Not available for booking</p>
        <p className="mt-1.5 leading-relaxed">
          Only tutors who have completed all seven verification steps can take bookings on TopTutor.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      {/* Price header — reflects the selected session mode */}
      <div className="flex items-baseline justify-between">
        <div>
          {homeVisit ? (
            tutor.monthlyRate ? (
              <>
                <span className="text-sm text-muted-foreground">from </span>
                <span className="font-display text-2xl font-extrabold">{formatPKR(tutor.monthlyRate)}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </>
            ) : (
              <span className="font-display text-lg font-bold">Contact for pricing</span>
            )
          ) : (
            <>
              <span className="font-display text-2xl font-extrabold">{formatPKR(tutor.hourlyRate)}</span>
              <span className="text-sm text-muted-foreground">/hour</span>
            </>
          )}
        </div>
        <Badge variant="success">
          <Zap className="h-3 w-3" /> Available
        </Badge>
      </div>

      {homeVisit ? (
        /* Home-visit view — the tutor's monthly starting price + how it's arranged */
        <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/20 dark:bg-brand-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Home className="h-4 w-4 text-brand-600 dark:text-brand-400" /> In-person home tutoring
          </div>
          <div className="mt-1.5 font-display">
            {tutor.monthlyRate ? (
              <>
                <span className="text-sm font-normal text-muted-foreground">Starting from </span>
                <span className="text-2xl font-extrabold">{formatPKR(tutor.monthlyRate)}</span>
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </>
            ) : (
              <span className="text-lg font-bold">Contact the tutor for pricing</span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            A monthly package for sessions at your location.{' '}
            {tutor.demoAvailable
              ? `Book a free intro call to confirm the schedule and finalise details with ${tutor.name.split(' ')[0]}.`
              : `Message ${tutor.name.split(' ')[0]} to confirm the schedule and finalise details.`}
          </p>
        </div>
      ) : (
        /* Online view — session packages + pay-per-package booking */
        <>
          <div className="mt-5 space-y-2">
            {tutor.packages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPkg(p.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all',
                  selectedPkg === p.id
                    ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                    : 'hover:border-brand-200 hover:bg-secondary/50',
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{p.title}</span>
                    {p.popular && <Badge variant="gold" className="text-[10px]">Best value</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.sessions} session{p.sessions > 1 ? 's' : ''} · {formatPKR(p.pricePerSession)}/session
                  </div>
                </div>
                <span className="font-display font-bold">{formatPKR(p.totalPrice)}</span>
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-1.5">
            {pkg.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-brand-500" /> {perk}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <BookingFlow tutor={tutor} pkg={pkg} />
          </div>
        </>
      )}

      {/* Free intro call — offered in either mode, but only by tutors who have opened a demo
          slot on their schedule. `demoAvailable` carries that, so the panel never offers a
          call the tutor has not made available. Messaging stays reachable regardless via the
          profile's "Send a message" button. */}
      {tutor.demoAvailable && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={booking}
            onClick={() => book(Number(tutor.id), { tutorName: tutor.name, slug: tutor.slug })}
          >
            {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
            Free 15-min intro call
          </Button>
        </div>
      )}

      {/* Only methods the learner can actually use are advertised here — a "coming soon" method
          belongs on the picker, not on the promise made before they click. */}
      {!homeVisit && (
        <div className="mt-4 rounded-xl bg-secondary/60 p-3">
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure payment with
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {/* White chips in both themes: the wallet wordmarks are dark artwork, and a row of
                badges that changes colour halfway across reads as two different things. */}
            {BOOKING_PAYMENT_METHODS.filter((m) => isMethodAvailable(m.id)).map((m) => (
              <span
                key={m.id}
                className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800"
              >
                {m.wordmark ? (
                  <PaymentWordmark method={m.id} />
                ) : (
                  <>
                    <PaymentMethodIcon method={m.id} size="sm" className="h-5 w-5" />
                    {m.id === 'CARD' ? 'Card' : m.id === 'BANK_TRANSFER' ? 'Bank transfer' : m.name}
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
