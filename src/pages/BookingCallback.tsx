import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MessageSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingService, type BookingStatus } from '@/services/bookingService';
import { ReceiptButton } from '@/components/booking/ReceiptButton';

type State = 'checking' | 'paid' | 'pending' | 'failed' | 'cancelled';

export default function BookingCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = Number(params.get('booking'));
  const cancelled = params.get('cancelled') === '1';

  const [state, setState] = useState<State>(cancelled ? 'cancelled' : 'checking');

  useEffect(() => {
    if (cancelled || !Number.isFinite(bookingId)) return;
    let stopped = false;
    let attempts = 0;

    const run = async () => {
      try {
        let status: BookingStatus;
        try {
          status = await bookingService.confirm(bookingId); // server-side verify
        } catch {
          status = await bookingService.get(bookingId);
        }
        if (stopped) return;
        if (status.canMessage) return setState('paid');
        if (status.paymentStatus === 'FAILED') return setState('failed');
        // Payment may still be settling (async webhook) — poll a few times.
        attempts += 1;
        if (attempts < 5) setTimeout(run, 2500);
        else setState('pending');
      } catch {
        if (!stopped) setState('failed');
      }
    };
    run();
    return () => {
      stopped = true;
    };
  }, [bookingId, cancelled]);

  const meta: Record<State, { icon: typeof CheckCircle2; tone: string; title: string; body: string }> = {
    checking: { icon: Loader2, tone: 'text-brand-600', title: 'Confirming your payment…', body: 'Hang tight, this only takes a moment.' },
    paid: { icon: CheckCircle2, tone: 'text-emerald-600', title: 'Payment successful! 🎉', body: 'Your session is booked and you can now message your tutor.' },
    pending: { icon: Clock, tone: 'text-amber-600', title: 'Payment is processing', body: 'We’ll confirm your booking shortly — check your bookings in a minute.' },
    failed: { icon: XCircle, tone: 'text-red-600', title: 'Payment not completed', body: 'Your card was not charged. Please try booking again.' },
    cancelled: { icon: XCircle, tone: 'text-muted-foreground', title: 'Payment cancelled', body: 'No charge was made. You can pick a slot and try again anytime.' },
  };
  const m = meta[state];
  const Icon = m.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary ${m.tone}`}>
          <Icon className={`h-8 w-8 ${state === 'checking' ? 'animate-spin' : ''}`} />
        </div>
        <h1 className="font-display text-2xl font-bold">{m.title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{m.body}</p>

        <div className="mt-6 flex flex-col gap-2">
          {state === 'paid' && (
            <Button variant="gradient" size="lg" onClick={() => navigate('/dashboard/student/messages')}>
              <MessageSquare className="h-4 w-4" /> Message your tutor
            </Button>
          )}
          {state === 'paid' && <ReceiptButton bookingId={bookingId} size="default" label="View payment receipt" />}
          {(state === 'pending' || state === 'paid') && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/student/bookings">View my bookings</Link>
            </Button>
          )}
          {(state === 'failed' || state === 'cancelled') && (
            <Button variant="gradient" asChild>
              <Link to="/tutors">Back to tutors</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
