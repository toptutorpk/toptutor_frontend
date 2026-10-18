import { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileUp,
  Loader2,
  Lock,
  RefreshCw,
  Send,
  ShieldCheck,
  SmartphoneNfc,
  X,
} from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import {
  BOOKING_BANK_ACCOUNT,
  BOOKING_HOLD_MINUTES,
  BOOKING_PAYMENT_METHODS,
  type BookingPaymentMethod,
} from '@/constants/payment';
import { maskMsisdn, normaliseMsisdn, type WalletDetails } from '@/services/paymentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { PaymentMethodIcon, PaymentWordmark } from './PaymentMethodIcon';
import { type BookingDraft, METHOD_TONE, chargeFor, formatClock, isMethodAvailable, isSimulated, methodInfo, useCountdown } from './flow';
import { DraftSummary, FinePrint, FlowHeader, PriceBreakdown, Stepper, TotalLine } from './FlowChrome';

const TAG_VARIANT = { success: 'success', info: 'info', neutral: 'secondary' } as const;

const CONTINUE_LABEL: Record<BookingPaymentMethod, string> = {
  CARD: 'Continue with card',
  EASYPAISA: 'Continue with Easypaisa',
  JAZZCASH: 'Continue with JazzCash',
  BANK_TRANSFER: 'Continue with bank transfer',
};

/* ------------------------------------------------------------------------------------------------
 * Step 2 — choose a method
 * --------------------------------------------------------------------------------------------- */

export function MethodStep({
  draft,
  method,
  onMethod,
  onBack,
  onContinue,
  holdSecondsLeft,
  busy,
}: {
  draft: BookingDraft;
  method: BookingPaymentMethod;
  onMethod: (m: BookingPaymentMethod) => void;
  onBack: () => void;
  onContinue: () => void;
  /** Set once a hold exists (the learner came back from a method to pick another). */
  holdSecondsLeft: number | null;
  busy: boolean;
}) {
  return (
    <>
      <FlowHeader title="Choose payment method" onBack={onBack} />
      <Stepper current={1} />
      <DraftSummary draft={draft} onEdit={onBack} />

      <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
        {BOOKING_PAYMENT_METHODS.map((m) => {
          const available = isMethodAvailable(m.id);
          const active = m.id === method;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!available}
              onClick={() => onMethod(m.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                active
                  ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                  : 'hover:border-brand-200 hover:bg-secondary/50',
                !available && 'cursor-not-allowed opacity-60 hover:border-border hover:bg-transparent',
              )}
            >
              <PaymentMethodIcon method={m.id} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold">{m.name}</span>
                  {!available ? (
                    <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
                  ) : (
                    m.tag && (
                      <Badge variant={TAG_VARIANT[m.tagTone ?? 'info']} className="text-[10px]">
                        {m.tag}
                      </Badge>
                    )
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.blurb}</p>
              </div>
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  active ? 'border-brand-600' : 'border-muted-foreground/40',
                )}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
              </span>
            </button>
          );
        })}
      </div>

      <PriceBreakdown draft={draft} method={method} />

      {/* Dev builds run the not-yet-live methods against a simulated provider. Said once, here,
          rather than badged on every method so the tags read as they will in production. */}
      {BOOKING_PAYMENT_METHODS.some((m) => isSimulated(m.id)) && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
          Dev preview: {BOOKING_PAYMENT_METHODS.filter((m) => isSimulated(m.id)).map((m) => m.name).join(', ')} use a simulated provider — no real payment is made.
        </p>
      )}

      <div className="space-y-2">
        <Button variant="gradient" size="lg" className="w-full" disabled={busy} onClick={onContinue}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {CONTINUE_LABEL[method]} <ArrowRight className="h-4 w-4" />
        </Button>
        <FinePrint icon={Lock}>
          {holdSecondsLeft != null
            ? `Encrypted payment · Your slot is held for another ${formatClock(holdSecondsLeft)}`
            : `Encrypted payment · Your slot is held for ${BOOKING_HOLD_MINUTES} minutes once you continue`}
        </FinePrint>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Card — hand off to Safepay's hosted checkout. Card numbers are never typed into TopTutor.
 * --------------------------------------------------------------------------------------------- */

export function CardStep({
  draft,
  busy,
  onBack,
  onPay,
}: {
  draft: BookingDraft;
  busy: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const cardCharge = chargeFor(draft.total, 'CARD');
  return (
    <>
      <FlowHeader title="Pay with card" subtitle="Step 2 of 3 · Payment" onBack={onBack} />

      <div className="flex items-center justify-center gap-4 rounded-2xl bg-brand-50 px-4 py-6 dark:bg-brand-500/10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card font-display text-base font-bold text-brand-600 shadow-soft dark:text-brand-300">
          You
        </span>
        <span aria-hidden className="w-16 border-t-2 border-dashed border-brand-300" />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
          <ShieldCheck className="h-7 w-7" />
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold">You’ll enter your card on Safepay’s secure page</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          TopTutor never sees or stores your card number. After paying you’ll be brought back here
          automatically and your session will be confirmed.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cards accepted</p>
        <div className="flex flex-wrap gap-2">
          {['Visa', 'Mastercard', 'UnionPay', 'PayPak'].map((c) => (
            <span key={c} className="rounded-lg border bg-secondary/40 px-3 py-1.5 text-xs font-semibold">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 rounded-xl border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Your bank may ask for a one-time code (3-D Secure) to verify this payment. Keep your phone nearby.
      </div>

      <div className="space-y-1.5 border-t pt-3 text-sm text-muted-foreground">
        <div className="flex justify-between gap-3">
          <span>Session fee</span>
          <span className="tabular-nums">{formatPKR(cardCharge.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>Card processing fee · {cardCharge.feePercent}%</span>
          <span className="tabular-nums">{formatPKR(cardCharge.fee)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <TotalLine draft={draft} method="CARD" />
        <Button size="lg" className={cn('w-full', METHOD_TONE.CARD.button)} disabled={busy} onClick={onPay}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Continue to secure checkout <ExternalLink className="h-4 w-4" />
        </Button>
        <FinePrint>Opens in this window · Don’t close the tab until you’re back</FinePrint>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Easypaisa / JazzCash — enter the wallet number, then approve the push request in the app.
 * --------------------------------------------------------------------------------------------- */

type Wallet = 'EASYPAISA' | 'JAZZCASH';

export function WalletStep({
  draft,
  wallet,
  busy,
  initial,
  onBack,
  onSend,
}: {
  draft: BookingDraft;
  wallet: Wallet;
  busy: boolean;
  initial?: WalletDetails;
  onBack: () => void;
  onSend: (details: WalletDetails) => void;
}) {
  const info = methodInfo(wallet);
  const tone = METHOD_TONE[wallet];
  const [number, setNumber] = useState(initial?.msisdn ?? '');
  const [cnic, setCnic] = useState(initial?.cnicLast6 ?? '');
  const [touched, setTouched] = useState(false);
  const msisdn = normaliseMsisdn(number);
  const needsCnic = wallet === 'JAZZCASH';
  const cnicOk = !needsCnic || /^\d{6}$/.test(cnic);
  const valid = msisdn != null && cnicOk;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) onSend({ msisdn: msisdn!, ...(needsCnic ? { cnicLast6: cnic } : {}) });
  };

  return (
    <form onSubmit={submit} className="contents">
      <FlowHeader title={`Pay with ${info.name}`} subtitle="Step 2 of 3 · Payment" onBack={onBack} />

      {/* The provider's own wordmark, so the learner knows exactly which app the request will land
          in. On white in both themes — the artwork is dark. */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <PaymentWordmark method={wallet} size="md" />
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Mobile account
        </span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="wallet-number" className="text-sm font-semibold">
          {info.name} mobile account number
        </label>
        <div
          className={cn(
            'flex h-12 items-stretch overflow-hidden rounded-xl border bg-background ring-0 transition-shadow focus-within:ring-4',
            tone.ring,
            touched && !msisdn && 'border-red-500',
          )}
        >
          <span className={cn('flex items-center border-r px-3.5 text-sm font-semibold', tone.soft, tone.text)}>+92</span>
          <input
            id="wallet-number"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="300 1234567"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d\s+-]/g, '').slice(0, 16))}
            aria-invalid={touched && !msisdn}
            className="min-w-0 flex-1 bg-transparent px-3.5 font-display text-lg font-semibold tracking-wide tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
          />
        </div>
        <p className={cn('text-xs', touched && !msisdn ? 'text-red-600' : 'text-muted-foreground')}>
          {touched && !msisdn
            ? 'Enter a Pakistani mobile number, e.g. 0300 1234567'
            : `The number registered with your ${info.name} account`}
        </p>
      </div>

      {needsCnic && (
        <div className="space-y-1.5">
          <label htmlFor="wallet-cnic" className="text-sm font-semibold">
            Last 6 digits of your CNIC
          </label>
          <Input
            id="wallet-cnic"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="••••••"
            value={cnic}
            onChange={(e) => setCnic(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={touched && !cnicOk}
            className="h-12 font-display text-lg tracking-[0.3em] tabular-nums"
          />
          <p className={cn('text-xs', touched && !cnicOk ? 'text-red-600' : 'text-muted-foreground')}>
            JazzCash uses this to match the payment to your account.
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-secondary/40 p-4">
        <p className="text-sm font-semibold">How it works</p>
        <ol className="mt-3 space-y-2.5">
          {[
            <>We send a payment request of <strong className="text-foreground">{formatPKR(draft.total)}</strong> to your number</>,
            <>Open the {info.name} app (or tap the notification) and review the request</>,
            <>Approve with your MPIN — your session is booked instantly</>,
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', tone.soft, tone.text)}>
                {i + 1}
              </span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
        Make sure your account has at least {formatPKR(draft.total)} available.
      </p>

      <div className="space-y-3">
        <TotalLine draft={draft} method={wallet} />
        <Button type="submit" size="lg" className={cn('w-full', tone.button)} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send payment request
        </Button>
        <FinePrint icon={Lock}>We never ask for your MPIN on this website</FinePrint>
      </div>
    </form>
  );
}

export function WalletWaitingStep({
  draft,
  wallet,
  msisdn,
  expiresAt,
  onCheck,
  onResend,
  onOtherMethod,
}: {
  draft: BookingDraft;
  wallet: Wallet;
  msisdn: string;
  expiresAt: string;
  onCheck: () => void;
  onResend: () => void;
  onOtherMethod: () => void;
}) {
  const info = methodInfo(wallet);
  const tone = METHOD_TONE[wallet];
  const left = useCountdown(expiresAt) ?? 0;
  // The full window as it stood when the request was sent — the bar drains from here. The flow
  // remounts this step (keyed on `expiresAt`) on resend, so a new request starts a full bar.
  const [windowSeconds] = useState(() =>
    Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  const expired = left === 0;

  return (
    <>
      <FlowHeader
        title="Approve the payment on your phone"
        onBack={onOtherMethod}
        aside={
          <Badge variant={expired ? 'destructive' : 'warning'} className="mt-1 hidden whitespace-nowrap sm:inline-flex">
            {expired ? 'Request expired' : 'Waiting for approval'}
          </Badge>
        }
      />

      <div className="text-center">
        {/* The provider's mark, haloed in its colour — "go to this app" at a glance. */}
        <span className={cn('relative mx-auto flex h-20 w-20 items-center justify-center rounded-full', tone.soft)}>
          {!expired && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-20', tone.button)} />}
          <PaymentMethodIcon method={wallet} size="lg" className="relative rounded-full shadow-soft" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-slate-900 text-white">
            <SmartphoneNfc className="h-3.5 w-3.5" />
          </span>
        </span>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          We sent a request for <strong className="text-foreground">{formatPKR(draft.total)}</strong> to{' '}
          <strong className="text-foreground tabular-nums">{maskMsisdn(msisdn)}</strong>. Open {info.name} and approve it
          with your MPIN.
        </p>
        <p className={cn('mt-4 font-display text-4xl font-extrabold tabular-nums', expired ? 'text-red-600' : tone.text)}>
          {formatClock(left)}
        </p>
        <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', expired ? 'bg-red-500' : tone.button)}
            style={{ width: `${(left / windowSeconds) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {expired ? 'This request has expired — send a new one.' : 'Request expires automatically'}
        </p>
      </div>

      <ul className="space-y-3 rounded-xl border bg-secondary/40 p-4 text-sm">
        <ProgressRow state="done">Request sent</ProgressRow>
        <ProgressRow state={expired ? 'failed' : 'active'}>Waiting for your approval</ProgressRow>
        <ProgressRow state="todo">Session booked</ProgressRow>
      </ul>

      <div className="space-y-2">
        <Button size="lg" className={cn('w-full', tone.button)} disabled={expired} onClick={onCheck}>
          I’ve approved it
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onResend}>
            <RefreshCw className="h-4 w-4" /> Resend request
          </Button>
          <Button variant="outline" onClick={onOtherMethod}>
            Use another method
          </Button>
        </div>
        <FinePrint>No notification? Open the {info.name} app and check pending approvals.</FinePrint>
      </div>
    </>
  );
}

function ProgressRow({ state, children }: { state: 'done' | 'active' | 'todo' | 'failed'; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      {state === 'done' && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      {state === 'active' && <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />}
      {state === 'failed' && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
          <X className="h-3.5 w-3.5" />
        </span>
      )}
      {state === 'todo' && <span className="h-6 w-6 rounded-full border-2 border-border" />}
      <span className={cn(state === 'active' && 'font-semibold', state === 'todo' && 'text-muted-foreground')}>
        {children}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Bank transfer — pay to our account with the booking reference, upload the receipt, admin confirms.
 * --------------------------------------------------------------------------------------------- */

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export function BankStep({
  draft,
  reference,
  busy,
  onBack,
  onSubmit,
}: {
  draft: BookingDraft;
  /** Booking reference the learner puts in the transfer's remarks — what an admin matches on. */
  reference: string;
  busy: boolean;
  onBack: () => void;
  onSubmit: (details: { transactionRef: string; proof: File }) => void;
}) {
  const [transactionRef, setTransactionRef] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const a = BOOKING_BANK_ACCOUNT;
  const refOk = transactionRef.trim().length >= 4;

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!PROOF_TYPES.includes(file.type)) return toast.error('Upload a PNG, JPG or PDF of your receipt');
    if (file.size > MAX_PROOF_BYTES) return toast.error('Receipt must be 5 MB or smaller');
    setProof(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (refOk && proof) onSubmit({ transactionRef: transactionRef.trim(), proof });
  };

  return (
    <form onSubmit={submit} className="contents">
      <FlowHeader title="Pay by bank transfer" subtitle="Step 2 of 3 · Payment" onBack={onBack} />

      <div className="divide-y rounded-xl border">
        <CopyRow label="Bank" value={a.bankName} />
        <CopyRow label="Account title" value={a.accountTitle} />
        <CopyRow label="Account number" value={a.accountNumber} copy />
        <CopyRow label="IBAN" value={a.iban} copy />
        <CopyRow label="Amount" value={formatPKR(draft.total)} copy={String(draft.total)} strong />
        <CopyRow label="Reference" value={reference} copy strong highlight />
      </div>

      <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Send the exact amount and put <strong className="text-foreground">{reference}</strong> in the transfer’s
          remarks / purpose field so we can match it to your booking.
        </span>
      </p>

      <div className="space-y-1.5">
        <label htmlFor="bank-txn" className="text-sm font-semibold">
          Transaction ID from your receipt
        </label>
        <Input
          id="bank-txn"
          autoComplete="off"
          placeholder="e.g. FT2610201234"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value.slice(0, 40))}
          aria-invalid={touched && !refOk}
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-semibold">Payment receipt</span>
        <input
          ref={fileRef}
          type="file"
          accept={PROOF_TYPES.join(',')}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border border-dashed p-3.5 text-left text-sm transition-colors hover:bg-secondary/50',
            touched && !proof && 'border-red-500',
            proof && 'border-solid border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
            {proof ? <Check className="h-4 w-4 text-emerald-600" /> : <FileUp className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{proof ? proof.name : 'Upload screenshot or PDF'}</span>
            <span className="block text-xs text-muted-foreground">
              {proof ? `${(proof.size / 1024).toFixed(0)} KB · tap to replace` : 'PNG, JPG or PDF · up to 5 MB'}
            </span>
          </span>
        </button>
      </div>

      <div className="space-y-3">
        <TotalLine draft={draft} method="BANK_TRANSFER" />
        <Button type="submit" size="lg" className={cn('w-full', METHOD_TONE.BANK_TRANSFER.button)} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit for confirmation
        </Button>
        <FinePrint>We confirm transfers {a.reviewWindow}. Your slot stays reserved until then.</FinePrint>
      </div>
    </form>
  );
}

function CopyRow({
  label,
  value,
  copy,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  /** true copies `value` (spaces stripped); a string copies that instead. */
  copy?: boolean | string;
  strong?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = typeof copy === 'string' ? copy : value.replace(/\s/g, '');
  return (
    <div className={cn('flex items-center gap-3 px-3.5 py-2.5 text-sm', highlight && 'bg-amber-50/70 dark:bg-amber-500/10')}>
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn('min-w-0 flex-1 truncate text-right tabular-nums', strong ? 'font-bold' : 'font-medium')}>{value}</span>
      {copy ? (
        <button
          type="button"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() =>
            navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <span className="w-7 shrink-0" />
      )}
    </div>
  );
}
