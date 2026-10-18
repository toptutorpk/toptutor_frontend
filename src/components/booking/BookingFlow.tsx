import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import type { SessionPackage, Tutor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/client';
import { BOOKING_BANK_ACCOUNT, BOOKING_PAYMENT_METHODS, type BookingPaymentMethod } from '@/constants/payment';
import {
  bookingReference,
  paymentService,
  type PaymentHold,
  type PaymentStatus,
  type WalletDetails,
} from '@/services/paymentService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { type BookingDraft, isMethodAvailable, useCountdown } from './flow';
import { ScheduleStep } from './ScheduleStep';
import { useSlotPicker } from './useSlotPicker';
import { BankStep, CardStep, MethodStep, WalletStep, WalletWaitingStep } from './PaymentSteps';
import { ConfirmedView, FailedView, ProcessingView, UnderReviewView } from './ResultViews';

type Wallet = 'EASYPAISA' | 'JAZZCASH';

type Step =
  | { name: 'schedule' }
  | { name: 'method' }
  | { name: 'card' }
  | { name: 'wallet'; wallet: Wallet }
  | { name: 'waiting' }
  | { name: 'bank' }
  | { name: 'processing' }
  | { name: 'confirmed'; status: PaymentStatus }
  | { name: 'review'; status: PaymentStatus }
  | { name: 'failed'; method: BookingPaymentMethod; reason?: string };

/** An outstanding push request to the learner's wallet app. */
interface WalletRequestState {
  wallet: Wallet;
  details: WalletDetails;
  expiresAt: string;
}

const POLL_MS = 3000;

/** Identity of a draft, so a hold is only reused for the exact slot it was taken on. */
const draftKey = (d: BookingDraft) => `${d.packageId}|${d.date}|${d.slot.weeklySlotId}|${d.slot.start}|${d.slot.end}`;

const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.');

/**
 * Book a Session: schedule → payment method → pay → confirmed.
 *
 * <p>The booking (and the hold on its slot) is created when the learner commits to a method, not
 * when they open the dialog, so browsing times never blocks anyone else. Once held, the same
 * booking is reused if they come back and switch method, until the hold lapses or they change the
 * time.
 */
export function BookingFlow({ tutor, pkg }: { tutor: Tutor; pkg: SessionPackage }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ name: 'schedule' });
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  // Defaults to the first method on offer — the wallets lead the list, as they are what most
  // learners use and they carry no fee.
  const firstAvailable = () => BOOKING_PAYMENT_METHODS.find((m) => isMethodAvailable(m.id))?.id ?? 'CARD';
  const [method, setMethod] = useState<BookingPaymentMethod>(firstAvailable);
  const [hold, setHold] = useState<(PaymentHold & { key: string }) | null>(null);
  const [walletReq, setWalletReq] = useState<WalletRequestState | null>(null);
  const [busy, setBusy] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const picker = useSlotPicker(tutor, pkg, open);
  const holdLeft = useCountdown(hold?.expiresAt ?? null);

  const goSchedule = () => setStep({ name: 'schedule' });
  const goMethods = () => setStep({ name: 'method' });

  const fail = useCallback(
    (m: BookingPaymentMethod, reason?: string) => setStep({ name: 'failed', method: m, reason }),
    [],
  );

  /** The live hold for this draft, creating one if there is none or it has lapsed. */
  const ensureHold = async (d: BookingDraft, m: BookingPaymentMethod): Promise<PaymentHold> => {
    const reusable =
      m !== 'CARD' && // card needs a fresh Safepay checkout URL, which only comes with a new hold
      hold &&
      hold.key === draftKey(d) &&
      new Date(hold.expiresAt).getTime() > Date.now() + 5_000;
    if (reusable) return hold;
    const created = await paymentService.hold(
      {
        tutorId: Number(d.tutor.id),
        weeklySlotId: d.slot.weeklySlotId,
        sessionDate: d.date,
        start: d.slot.start,
        end: d.slot.end,
        packageId: d.packageId,
      },
      m,
    );
    setHold({ ...created, key: draftKey(d) });
    return created;
  };

  /* ---- step transitions ------------------------------------------------------------------- */

  const continueFromSchedule = (d: BookingDraft) => {
    if (!user) {
      navigate('/login', { state: { from: `/tutors/${tutor.slug}` } });
      return;
    }
    if (user.role !== 'student' && user.role !== 'parent') {
      toast.info('Use a student or parent account to book a session.');
      return;
    }
    if (hold && hold.key !== draftKey(d)) setHold(null); // a new time means a new booking
    setDraft(d);
    if (!isMethodAvailable(method)) setMethod(firstAvailable());
    goMethods();
  };

  const continueFromMethods = () => {
    if (method === 'CARD') setStep({ name: 'card' });
    else if (method === 'BANK_TRANSFER') openBank();
    else setStep({ name: 'wallet', wallet: method });
  };

  /** Bank transfer needs its booking reference up front — the learner types it into their bank app. */
  const openBank = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await ensureHold(draft, 'BANK_TRANSFER');
      setStep({ name: 'bank' });
    } catch (e) {
      toast.error('Could not reserve this slot', { description: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const payByCard = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const h = await ensureHold(draft, 'CARD');
      if (!h.checkoutUrl) throw new Error('The payment page could not be opened.');
      window.location.href = h.checkoutUrl; // Safepay hosted checkout; returns to /booking/callback
    } catch (e) {
      toast.error('Could not start payment', { description: errorText(e) });
      setBusy(false);
    }
  };

  const sendWalletRequest = async (wallet: Wallet, details: WalletDetails) => {
    if (!draft) return;
    setBusy(true);
    try {
      const h = await ensureHold(draft, wallet);
      const req = await paymentService.requestWallet(h.bookingId, wallet, details);
      setWalletReq({ wallet, details, expiresAt: req.expiresAt });
      setStep({ name: 'waiting' });
    } catch (e) {
      toast.error('Could not send the payment request', { description: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const settle = useCallback(
    (status: PaymentStatus, m: BookingPaymentMethod) => {
      if (status.state === 'PAID') setStep({ name: 'confirmed', status });
      else if (status.state === 'UNDER_REVIEW') setStep({ name: 'review', status });
      else if (status.state === 'FAILED') fail(m, status.failureReason);
      return status.state !== 'PENDING';
    },
    [fail],
  );

  // While a wallet request is outstanding, watch for the approval arriving on its own.
  const pollBookingId = step.name === 'waiting' ? hold?.bookingId : undefined;
  const pollWallet = walletReq?.wallet;
  const settleRef = useRef(settle);
  settleRef.current = settle;
  useEffect(() => {
    if (!pollBookingId || !pollWallet) return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const s = await paymentService.status(pollBookingId);
        if (!stopped) settleRef.current(s, pollWallet);
      } catch {
        /* transient — the next tick retries */
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [pollBookingId, pollWallet]);

  // A request that times out without approval is a failed attempt, not a silent dead end.
  const walletLeft = useCountdown(step.name === 'waiting' ? (walletReq?.expiresAt ?? null) : null);
  useEffect(() => {
    if (walletLeft === 0 && walletReq) {
      fail(walletReq.wallet, `The ${walletReq.wallet === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa'} request expired before it was approved.`);
    }
  }, [walletLeft, walletReq, fail]);

  const checkNow = async () => {
    if (!hold || !walletReq) return;
    setStep({ name: 'processing' });
    try {
      const s = await paymentService.status(hold.bookingId);
      if (!settle(s, walletReq.wallet)) {
        toast.info('Not approved yet', { description: 'Approve the request in the app, then try again.' });
        setStep({ name: 'waiting' });
      }
    } catch (e) {
      toast.error('Could not check the payment', { description: errorText(e) });
      setStep({ name: 'waiting' });
    }
  };

  const submitBank = async (details: { transactionRef: string; proof: File }) => {
    if (!draft) return;
    setBusy(true);
    try {
      const h = await ensureHold(draft, 'BANK_TRANSFER');
      const s = await paymentService.submitBankTransfer(h.bookingId, details);
      settle(s, 'BANK_TRANSFER');
    } catch (e) {
      toast.error('Could not submit your transfer', { description: errorText(e) });
    } finally {
      setBusy(false);
    }
  };

  const retry = (m: BookingPaymentMethod) => {
    if (holdLeft === 0) return goSchedule();
    if (m === 'CARD') setStep({ name: 'card' });
    else if (m === 'BANK_TRANSFER') openBank();
    else setStep({ name: 'wallet', wallet: m });
  };

  /* ---- dialog lifecycle ------------------------------------------------------------------- */

  const locked = busy || step.name === 'processing';
  const onOpenChange = (next: boolean) => {
    if (!next && locked) return;
    setOpen(next);
    if (!next) {
      // A finished booking starts over; anything else resumes at the schedule with choices intact.
      if (step.name === 'confirmed' || step.name === 'review') {
        setHold(null);
        setDraft(null);
        setWalletReq(null);
        picker.setSelected(null);
      }
      setStep({ name: 'schedule' });
    }
  };

  const reference = hold ? bookingReference(hold.bookingId) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="w-full">
          <CalendarDays className="h-4 w-4" /> Book a Session
        </Button>
      </DialogTrigger>
      {/* `[&>*]:min-w-0` is load-bearing: DialogContent lays children out in an auto-sized grid
          column, and without a zero minimum the date strip's max-content width would drag the
          column (and the pay button with it) past `max-w-lg`. */}
      <DialogContent
        className="no-scrollbar max-h-[90vh] gap-5 overflow-y-auto [&>*]:min-w-0"
        onInteractOutside={(e) => locked && e.preventDefault()}
        onEscapeKeyDown={(e) => locked && e.preventDefault()}
      >
        {step.name === 'schedule' || !draft ? (
          <ScheduleStep tutor={tutor} pkg={pkg} picker={picker} onContinue={continueFromSchedule} />
        ) : step.name === 'method' ? (
          <MethodStep
            draft={draft}
            method={method}
            onMethod={setMethod}
            onBack={goSchedule}
            onContinue={continueFromMethods}
            busy={busy}
            holdSecondsLeft={hold && hold.key === draftKey(draft) ? holdLeft : null}
          />
        ) : step.name === 'card' ? (
          <CardStep draft={draft} busy={busy} onBack={goMethods} onPay={payByCard} />
        ) : step.name === 'wallet' ? (
          <WalletStep
            key={step.wallet}
            draft={draft}
            wallet={step.wallet}
            busy={busy}
            initial={walletReq?.wallet === step.wallet ? walletReq.details : undefined}
            onBack={goMethods}
            onSend={(details) => sendWalletRequest(step.wallet, details)}
          />
        ) : step.name === 'waiting' && walletReq ? (
          <WalletWaitingStep
            key={walletReq.expiresAt}
            draft={draft}
            wallet={walletReq.wallet}
            msisdn={walletReq.details.msisdn}
            expiresAt={walletReq.expiresAt}
            onCheck={checkNow}
            onResend={() => sendWalletRequest(walletReq.wallet, walletReq.details)}
            onOtherMethod={goMethods}
          />
        ) : step.name === 'bank' ? (
          <BankStep draft={draft} reference={reference} busy={busy} onBack={goMethods} onSubmit={submitBank} />
        ) : step.name === 'processing' ? (
          <ProcessingView draft={draft} />
        ) : step.name === 'confirmed' ? (
          <ConfirmedView draft={draft} status={step.status} />
        ) : step.name === 'review' ? (
          <UnderReviewView draft={draft} status={step.status} reviewWindow={BOOKING_BANK_ACCOUNT.reviewWindow} />
        ) : step.name === 'failed' ? (
          <FailedView
            draft={draft}
            method={step.method}
            reason={step.reason}
            holdExpiresAt={hold?.expiresAt ?? null}
            onRetry={() => retry(step.method)}
            onOtherMethod={goMethods}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
