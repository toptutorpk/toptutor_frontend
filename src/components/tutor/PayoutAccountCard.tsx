import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
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
import { OtpInput } from '@/components/auth/OtpInput';
import { useCooldown } from '@/hooks/useCooldown';
import type { PayoutConfirmation, SavePayoutAccountRequest } from '@/services/payoutService';
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
  const [challenge, setChallenge] = useState<PayoutConfirmation | null>(null);
  const [draft, setDraft] = useState<SavePayoutAccountRequest | null>(null);
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState(0);
  const cooldown = useCooldown();
  const isWallet = method === 'MOBILE_WALLET';
  const send = useMutation({
    mutationFn: (details: SavePayoutAccountRequest) => payoutService.startConfirmation(details),
    onSuccess: (result, details) => {
      setDraft(details);
      setChallenge(result);
      setCode('');
      setResetCode((n) => n + 1);
      cooldown.start();
      toast.success('Verification code sent', {
        description: 'Check your account email. The code expires in 10 minutes.',
      });
      if (result.devCode)
        toast.info('Dev verification code', { description: result.devCode, duration: 15000 });
    },
    onError: (e) =>
      toast.error('Could not send the code', {
        description: e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  // Banks and wallets come from the database, so adding one is a row rather than a release.
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['payout-providers', method],
    queryFn: () => payoutService.providers(method),
    staleTime: 60 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: () => payoutService.confirm(challenge!.challengeId, code, draft!),
    onSuccess: (saved) => {
      qc.setQueryData(['payout-account'], saved);
      onOpenChange(false);
      setAccountNumber('');
      setCode('');
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
    provider.trim() !== '' && accountTitle.trim() !== '' && accountNumber.trim().length >= 6;

  const chooseMethod = (next: PayoutMethod) => {
    setMethod(next);
    // The provider list is per method, so a bank left selected while switching to wallets would be
    // sent and refused. Clearing it is what keeps the form honest about what is chosen.
    setProvider(next === account.method ? (account.provider ?? '') : '');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (save.isPending || send.isPending ? null : onOpenChange(next))}
    >
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
            if (save.isPending || send.isPending) return;
            if (challenge && draft && code.length === 6) save.mutate();
            else if (!challenge && canSave)
              send.mutate({ method, provider, accountTitle, accountNumber });
          }}
        >
          {!challenge && (
            <fieldset disabled={send.isPending} className="space-y-4">
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
            </fieldset>
          )}
          {challenge && draft && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">
                  {draft.provider} · {draft.accountTitle}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Account ending in {draft.accountNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-4)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to{' '}
                <span className="font-medium text-foreground">{challenge.maskedEmail}</span>. It
                expires in 10 minutes.
              </p>
              <fieldset disabled={save.isPending || send.isPending}>
                <OtpInput resetToken={resetCode} onChange={setCode} />
              </fieldset>
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={save.isPending || send.isPending}
                  onClick={() => {
                    setChallenge(null);
                    setCode('');
                  }}
                >
                  Edit details
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={cooldown.active || send.isPending || save.isPending}
                  onClick={() => send.mutate(draft)}
                >
                  {send.isPending
                    ? 'Sending…'
                    : cooldown.active
                      ? 'Resend in ' + cooldown.remaining + 's'
                      : 'Resend code'}
                </Button>
              </div>
            </div>
          )}
          <p className="flex items-start gap-2 rounded-xl border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Confirm using a code sent to your verified TopTutor email. Your payout details are
              saved only after verification.
            </span>
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={save.isPending || send.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={
                save.isPending || send.isPending || (challenge ? code.length !== 6 : !canSave)
              }
            >
              {save.isPending
                ? 'Saving…'
                : send.isPending
                  ? 'Sending…'
                  : challenge
                    ? 'Verify & save'
                    : 'Continue'}
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
