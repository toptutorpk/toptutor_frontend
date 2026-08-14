import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Phone, ShieldCheck, Zap, Check, Loader2, Clock, Home } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { SessionPackage, Tutor } from '@/types';
import { useBookIntro } from '@/hooks/useBookIntro';
import { useAuthStore } from '@/store/authStore';
import { bookingService, priceForSession } from '@/services/bookingService';
import { isPublicTutor } from '@/services/tutorService';
import { availabilityService, formatDuration, formatTime } from '@/services/availabilityService';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

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
            A monthly package for sessions at your location. Book a free intro call to confirm the
            schedule and finalise details with {tutor.name.split(' ')[0]}.
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
            <BookingDialog tutor={tutor} pkg={pkg} />
          </div>
        </>
      )}

      {/* Free intro call — available in either mode */}
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

      {!homeVisit && (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-secondary/60 p-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Secure payment via Safepay
        </div>
      )}
    </div>
  );
}

/** One bookable session: a concrete start and end carved out of a published window. */
interface SessionSlot {
  weeklySlotId: number;
  start: string;
  end: string;
}

/**
 * '08:00' + '09:00' → '8:00 – 9:00 AM'.
 *
 * <p>The opening meridiem is dropped when both ends share it, which is the common case and the
 * difference between a chip that reads as one span and a chip that reads as two timestamps.
 */
function formatSlotRange(start: string, end: string): string {
  const from = formatTime(start);
  const to = formatTime(end);
  return from.slice(-2) === to.slice(-2) ? `${from.slice(0, -3)} – ${to}` : `${from} – ${to}`;
}

/**
 * Pick a date, a start time and a length → pay via Safepay.
 *
 * <p>The tutor publishes a recurring window; the learner buys a slice of it on one date. The choices
 * offered here are generated from the rules the server sends back with the slots (minimum length and
 * grid step), so the picker cannot offer a combination the server would then reject.
 */
function BookingDialog({ tutor, pkg }: { tutor: Tutor; pkg: SessionPackage }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<SessionSlot | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const packageId = pkg.id.replace('pkg-', '');

  // Only fetched once the dialog opens — the profile page shouldn't pay for a calendar nobody opened.
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'slots', tutor.id],
    queryFn: () => availabilityService.publicSlots(Number(tutor.id)),
    enabled: open,
  });

  const days = data?.days ?? [];
  const activeDay = days.find((d) => d.date === date) ?? null;

  /** Lengths that fit inside at least one of the day's windows. */
  const lengthOptions = useMemo<number[]>(() => {
    if (!activeDay || !data) return [];
    const longest = activeDay.ranges.reduce(
      (max, r) => Math.max(max, toMinutes(r.end) - toMinutes(r.start)),
      0,
    );
    const lengths: number[] = [];
    for (let m = data.minSessionMinutes; m <= longest; m += data.granularityMinutes) lengths.push(m);
    return lengths;
  }, [activeDay, data]);

  /**
   * The day's windows cut into whole sessions of the chosen length.
   *
   * <p>Sessions run back to back from the start of each window, so what the learner picks is a
   * real appointment rather than an arbitrary offset into the tutor's hours. A window that does not
   * divide evenly simply stops offering slots once the remainder is too short to hold one — an
   * 80-minute window offers a single hour, not an hour and a stub.
   */
  const slots = useMemo<SessionSlot[]>(() => {
    if (!activeDay || !minutes) return [];
    const out: SessionSlot[] = [];
    for (const range of activeDay.ranges) {
      const end = toMinutes(range.end);
      for (let t = toMinutes(range.start); t + minutes <= end; t += minutes) {
        out.push({
          weeklySlotId: range.weeklySlotId,
          start: fromMinutes(t),
          end: fromMinutes(t + minutes),
        });
      }
    }
    return out.sort((a, b) => a.start.localeCompare(b.start));
  }, [activeDay, minutes]);

  // Keep the selection coherent as the learner moves back up the funnel.
  useEffect(() => {
    setSelected(null);
  }, [date]);

  // Settle on a length the day can actually accommodate, preserving the learner's own choice
  // whenever the new day still offers it rather than silently resetting them to the shortest.
  useEffect(() => {
    setMinutes((current) =>
      current && lengthOptions.includes(current) ? current : (lengthOptions[0] ?? null),
    );
  }, [lengthOptions]);

  // A slot only means anything alongside the length it was cut for.
  useEffect(() => {
    setSelected(null);
  }, [minutes]);

  const total = minutes ? priceForSession(tutor.hourlyRate, packageId, minutes) : pkg.totalPrice;

  const pay = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/tutors/${tutor.slug}` } });
      return;
    }
    if (user.role !== 'student' && user.role !== 'parent') {
      toast.info('Use a student or parent account to book a session.');
      return;
    }
    if (!date || !selected || !minutes) {
      toast.error('Pick a date and time first');
      return;
    }
    setLoading(true);
    try {
      const res = await bookingService.createSession({
        tutorId: Number(tutor.id),
        weeklySlotId: selected.weeklySlotId,
        sessionDate: date,
        start: selected.start,
        end: selected.end,
        packageId,
      });
      window.location.href = res.checkoutUrl; // redirect to Safepay's hosted checkout
    } catch (e) {
      toast.error('Could not start payment', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="w-full">
          <CalendarDays className="h-4 w-4" /> Book a Session
        </Button>
      </DialogTrigger>
      {/* `[&>*]:min-w-0` is load-bearing. DialogContent lays its children out in
          a grid whose single column is auto-sized, and an auto track takes its
          growth limit from the widest child's max-content width — the date
          strip, whose row of day cards is far wider than the dialog. Without a
          zero minimum the track outgrows `max-w-lg`, and because every child
          stretches to that track, the total and the pay button are dragged wide
          too and their right-hand content (the amount, the button label) ends up
          outside the visible box. It also explains the horizontal scrollbar:
          `overflow-y-auto` makes the other axis compute to `auto`, so the
          overspill becomes scrollable rather than merely clipped.

          Letting the children shrink lets the strip's own `overflow-x-auto` do
          the scrolling it was always meant to do. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle>Book {pkg.title}</DialogTitle>
          <DialogDescription>Choose a date and time with {tutor.name}.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : days.length === 0 ? (
          <p className="rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
            {tutor.name.split(' ')[0]} has no online times open in the next few weeks. Try the free
            intro call.
          </p>
        ) : (
          <div className="space-y-4">
            <Step label="1. Pick a date">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => {
                  const d = new Date(`${day.date}T00:00:00`);
                  const active = day.date === date;
                  return (
                    <button
                      key={day.date}
                      onClick={() => setDate(day.date)}
                      className={cn(
                        'flex min-w-[3.75rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition-colors',
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'hover:bg-secondary',
                      )}
                    >
                      <span className="text-[10px] uppercase opacity-80">
                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                      <span className="text-base font-bold tabular-nums">{d.getDate()}</span>
                      <span className="text-[10px] opacity-80">
                        {d.toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>

            {date && (
              <Step label="2. Pick a time">
                {/* The length governs which slots exist, so it sits above them:
                    a control that silently rebuilds the list beneath it is
                    easier to follow than one that rebuilds the list above it.
                    Hidden entirely when the day only affords one length. */}
                {lengthOptions.length > 1 && minutes != null && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Session length</span>
                    {lengthOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMinutes(m)}
                        aria-pressed={m === minutes}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors',
                          m === minutes
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}
                      >
                        {formatDuration(m)}
                      </button>
                    ))}
                  </div>
                )}

                {slots.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                    {minutes
                      ? `No ${formatDuration(minutes)} session fits ${tutor.name.split(' ')[0]}’s hours on this day. Try a shorter length or another date.`
                      : `${tutor.name.split(' ')[0]} has no window long enough to book on this day. Try another date.`}
                  </p>
                ) : (
                  // A fixed two/three-up grid rather than wrapping: every chip
                  // carries a full range, so ragged rows of differing widths
                  // make the list markedly harder to scan.
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const active =
                        selected?.start === slot.start && selected.weeklySlotId === slot.weeklySlotId;
                      return (
                        <button
                          key={`${slot.weeklySlotId}-${slot.start}`}
                          onClick={() => setSelected(slot)}
                          aria-pressed={active}
                          className={cn(
                            'inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-sm font-medium tabular-nums transition-colors',
                            active
                              ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10 dark:text-brand-300'
                              : 'hover:bg-secondary',
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          {formatSlotRange(slot.start, slot.end)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Step>
            )}
          </div>
        )}

        {/* The amount is the one thing in this row that must never be dropped,
            so the label is what yields when space is short. */}
        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3 text-sm">
          <span className="truncate text-muted-foreground">Total</span>
          <span className="shrink-0 font-display text-lg font-bold tabular-nums">
            {formatPKR(total)}
          </span>
        </div>

        <Button
          variant="gradient"
          size="lg"
          disabled={loading || !date || !selected || !minutes}
          onClick={pay}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Pay {formatPKR(total)} with Safepay
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Step({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

/** 'HH:MM' → minutes since midnight. */
function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** 870 → '14:30'. */
function fromMinutes(total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
