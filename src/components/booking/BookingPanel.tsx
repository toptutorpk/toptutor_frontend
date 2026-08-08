import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Phone, ShieldCheck, Zap, Check, Loader2, Clock, Home } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { SessionPackage, Tutor } from '@/types';
import { useBookIntro } from '@/hooks/useBookIntro';
import { useAuthStore } from '@/store/authStore';
import { bookingService } from '@/services/bookingService';
import { formatRange } from '@/services/availabilityService';
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

/** Pick an online slot → pay the selected package via Safepay (redirect to hosted checkout). */
function BookingDialog({ tutor, pkg }: { tutor: Tutor; pkg: SessionPackage }) {
  const [open, setOpen] = useState(false);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const slots = (tutor.availabilitySlots ?? []).filter((s) => s.mode === 'ONLINE' && !s.booked);
  const packageId = pkg.id.replace('pkg-', '');

  const pay = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/tutors/${tutor.slug}` } });
      return;
    }
    if (user.role !== 'student' && user.role !== 'parent') {
      toast.info('Use a student or parent account to book a session.');
      return;
    }
    if (slotId == null) {
      toast.error('Select a time slot first');
      return;
    }
    setLoading(true);
    try {
      const res = await bookingService.createSession(Number(tutor.id), slotId, packageId);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {pkg.title}</DialogTitle>
          <DialogDescription>Choose an online time slot with {tutor.name}.</DialogDescription>
        </DialogHeader>

        {slots.length === 0 ? (
          <p className="rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
            {tutor.name.split(' ')[0]} hasn’t opened any online slots yet. Try the free intro call.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.id}
                onClick={() => setSlotId(s.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  slotId === s.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500 dark:bg-brand-500/10'
                    : 'hover:bg-secondary',
                )}
              >
                <Clock className="h-3.5 w-3.5" /> {formatRange(s.start, s.end)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between rounded-xl bg-secondary/60 p-3 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-lg font-bold">{formatPKR(pkg.totalPrice)}</span>
        </div>

        <Button variant="gradient" size="lg" disabled={loading || slots.length === 0} onClick={pay}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Pay {formatPKR(pkg.totalPrice)} with Safepay
        </Button>
      </DialogContent>
    </Dialog>
  );
}
