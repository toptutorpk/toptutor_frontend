import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Landmark,
  Lock,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProviderPicker } from '@/components/common/ProviderPicker';
import { BankLogo } from '@/components/common/BankLogo';
import { toast } from '@/components/ui/sonner';
import { ApiError } from '@/api/client';
import { cn } from '@/lib/utils';
import { payoutService, type PayoutAccountView, type PayoutMethod } from '@/services/payoutService';

/**
 * Where a tutor's earnings are sent.
 *
 * <p>The number is write-only from the browser's point of view: it is sent once and comes back only
 * as `••••4567`. Nothing here can display it, which is deliberate — a screen that can show it is a
 * screen that can leak it, and the tutor already knows their own account.
 */
export function PayoutAccountCard() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['payout-account'],
    queryFn: payoutService.get,
  });

  if (isLoading) return <Skeleton className="h-52 rounded-2xl" />;
  if (!data) return null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-br from-secondary/40 to-transparent p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold">Payout account</h2>
            <SecureChip />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Where we send your earnings once they clear.
          </p>
        </div>
        {data.eligible && (
          <Button variant={data.configured ? 'outline' : 'gradient'} onClick={() => setOpen(true)}>
            {data.configured ? 'Change account' : 'Add payout account'}
          </Button>
        )}
      </div>

      <div className="p-5">
        {!data.eligible ? (
          <Notice tone="muted" icon={Lock}>
            {data.ineligibleReason ?? 'Complete your verification before adding a payout account.'}
          </Notice>
        ) : !data.configured ? (
          <EmptyAccount onAdd={() => setOpen(true)} />
        ) : (
          <AccountSummary account={data} />
        )}
      </div>

      {open && <PayoutAccountDialog open={open} onOpenChange={setOpen} account={data} />}
    </div>
  );
}

/**
 * The reassurance chip.
 *
 * <p>It states what is actually true — the number is encrypted and never shown again — rather than
 * a vague "secure". A tutor is about to type the account their income lands in; the specific claim
 * is what earns that, and a generic padlock is what every phishing page also shows.
 */
function SecureChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700',
        'dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
        className,
      )}
      title="Your account number is encrypted before it is stored, and is never shown again — not even to you."
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Encrypted &amp; private
    </span>
  );
}

function EmptyAccount({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <Landmark className="h-6 w-6" />
      </span>
      <p className="mt-3 font-semibold">No payout account yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Add a bank account or mobile wallet so your cleared earnings can be sent to you.
      </p>
      <Button variant="gradient" className="mt-4" onClick={onAdd}>
        Add payout account
      </Button>
    </div>
  );
}

function AccountSummary({ account }: { account: PayoutAccountView }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border bg-secondary/20 p-4">
        <BankLogo name={account.provider ?? ''} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {account.provider}{' '}
            <span className="font-normal tabular-nums text-muted-foreground">
              {account.maskedNumber}
            </span>
          </p>
          <p className="truncate text-xs text-muted-foreground">{account.accountTitle}</p>
        </div>
        <StatusBadge status={account.status} />
      </div>

      {account.status === 'REJECTED' && (
        <Notice tone="red" icon={AlertTriangle}>
          {account.reviewNotes ??
            'These details were blocked by our team. Please check them and save them again.'}
        </Notice>
      )}

      {/* The cooling-off window is a security control, so it is explained rather than just shown —
          a tutor who does not know why their money is held will assume something is broken. */}
      {account.coolingOff && account.payableFromIso && (
        <Notice tone="amber" icon={Clock}>
          For your protection, no payout can be made to a newly changed account for{' '}
          {account.coolOffHours} hours. This one becomes payable in{' '}
          <strong>{formatDistanceToNow(parseISO(account.payableFromIso))}</strong>.
        </Notice>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'REJECTED') {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3" /> Blocked
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <CheckCircle2 className="h-3 w-3" /> Active
    </Badge>
  );
}

function PayoutAccountDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  account: PayoutAccountView;
}) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<PayoutMethod>(account.method ?? 'MOBILE_WALLET');
  const [provider, setProvider] = useState(account.provider ?? '');
  const [accountTitle, setAccountTitle] = useState(account.accountTitle ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isWallet = method === 'MOBILE_WALLET';

  // Some password managers fill the field regardless of the hints on it. Clear it once, shortly
  // after the dialog opens — but only while the cursor is elsewhere, so a tutor who has already
  // started typing never has their input wiped. This dialog is remounted on every open, so the
  // check runs against a fresh field each time.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (document.activeElement !== passwordRef.current) setPassword('');
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Banks and wallets come from the database, so adding one is a row rather than a release.
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['payout-providers', method],
    queryFn: () => payoutService.providers(method),
    staleTime: 60 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: () =>
      payoutService.save({ method, provider, accountTitle, accountNumber, password }),
    onSuccess: (saved) => {
      qc.setQueryData(['payout-account'], saved);
      onOpenChange(false);
      setAccountNumber('');
      setPassword('');
      toast.success('Payout account saved', {
        description: `Payouts will go to ${saved.provider} ${saved.maskedNumber}.`,
      });
    },
    onError: (e) => {
      toast.error('Could not save the account', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    },
  });

  const canSave =
    provider.trim() !== '' &&
    accountTitle.trim() !== '' &&
    accountNumber.trim().length >= 6 &&
    password !== '';

  const chooseMethod = (next: PayoutMethod) => {
    setMethod(next);
    // The provider list is per method, so a bank left selected while switching to wallets would be
    // sent and refused. Clearing it is what keeps the form honest about what is chosen.
    setProvider(next === account.method ? (account.provider ?? '') : '');
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (save.isPending ? null : onOpenChange(next))}>
      {/* The form is trimmed to fit outright — it does not scroll at any normal window size. A
          payments form that scrolls hides its own submit button, and a half-seen field is a
          mistyped one. The cap is a floor, not a scroll pane: it engages only on a window too
          short to show the dialog at all, where the alternative is an unreachable Save button. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {account.configured ? 'Change payout account' : 'Add payout account'}
            <SecureChip />
          </DialogTitle>
          <DialogDescription>
            Use an account in your own name. Your number is encrypted and never shown again.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave && !save.isPending) save.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <MethodTile
              active={isWallet}
              icon={Smartphone}
              label="Mobile wallet"
              hint="JazzCash, Easypaisa…"
              onClick={() => chooseMethod('MOBILE_WALLET')}
            />
            <MethodTile
              active={!isWallet}
              icon={Landmark}
              label="Bank account"
              hint="IBAN transfer"
              onClick={() => chooseMethod('BANK')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isWallet ? 'Wallet' : 'Bank'} htmlFor="payout-provider">
              <ProviderPicker
                id="payout-provider"
                items={providers}
                value={provider}
                onChange={setProvider}
                placeholder={
                  providersLoading ? 'Loading…' : isWallet ? 'Choose wallet' : 'Choose bank'
                }
                searchPlaceholder={isWallet ? 'Search wallet…' : 'Search bank…'}
                disabled={providersLoading}
              />
            </Field>

            <Field label="Account title" htmlFor="payout-title">
              <Input
                id="payout-title"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="Name on the account"
                autoComplete="off"
              />
            </Field>
          </div>

          <Field
            label={isWallet ? 'Mobile number' : 'IBAN'}
            htmlFor="payout-number"
            hint={
              account.configured
                ? 'We never show a saved number back — please enter it again in full.'
                : undefined
            }
          >
            <Input
              id="payout-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={isWallet ? '03001234567' : 'PK36SCBL0000001123456702'}
              inputMode={isWallet ? 'numeric' : 'text'}
              autoComplete="off"
              spellCheck={false}
              className={isWallet ? 'tabular-nums' : 'font-mono uppercase'}
            />
          </Field>

          <Field label="Account password" htmlFor="payout-password">
            <div className="relative">
              {/* Must NOT be autofilled. `current-password` would tell the browser this is the
                  saved sign-in field and have it filled on open — which quietly undoes the whole
                  point: the tutor is meant to prove they know the password right now, not have a
                  browser prove it for whoever is sitting at the machine. `new-password` is the
                  documented way to say "not the stored credential", and the data-* attributes opt
                  out of the common password managers, which ignore the standard hint. */}
              <Input
                ref={passwordRef}
                id="payout-password"
                name="payout-account-confirmation"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                className="pr-11"
                placeholder="Your TopTutor password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {/* The one line that has to survive: which password, and why they are being asked. */}
          <p className="flex items-start gap-2 rounded-xl border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Your{' '}
              <strong className="font-semibold text-foreground">TopTutor account password</strong>{' '}
              is required to add or change these details.
            </span>
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={!canSave || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MethodTile({
  active,
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
          : 'hover:bg-secondary',
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-semibold">{label}</span>
      <span className={cn('text-xs', active ? 'opacity-80' : 'text-muted-foreground')}>{hint}</span>
    </button>
  );
}

function Notice({
  tone,
  icon: Icon,
  children,
}: {
  tone: 'muted' | 'amber' | 'red';
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed',
        tone === 'muted' && 'bg-secondary/30 text-muted-foreground',
        tone === 'amber' &&
          'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
        tone === 'red' &&
          'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
