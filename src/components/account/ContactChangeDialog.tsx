import { useState } from 'react';
import { Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OtpInput } from '@/components/auth/OtpInput';
import { accountService, type ContactChannel } from '@/services/accountService';
import { ApiError } from '@/api/client';
import { isValidPhone, toE164, toNationalDisplay, PHONE_ERROR } from '@/lib/phone';
import { isValidEmail, normalizeEmail, EMAIL_ERROR } from '@/lib/email';
import { useCooldown } from '@/hooks/useCooldown';
import { toast } from '@/components/ui/sonner';

interface Props {
  channel: ContactChannel | null;
  currentValue?: string;
  onClose: () => void;
  /** Called with the account's new details once the change has actually been applied. */
  onChanged: (details: { phone: string; email?: string }) => void;
}

const COPY = {
  PHONE: {
    label: 'phone number',
    title: 'Change your phone number',
    icon: Phone,
    lead: "We'll send a 6-digit verification code to your new number to confirm it's yours.",
    inputLabel: 'New phone number',
    placeholder: '03001234567',
    hint: 'Must be different from your current number.',
    same: 'This is already your phone number.',
  },
  EMAIL: {
    label: 'email address',
    title: 'Change your email address',
    icon: Mail,
    lead: "We'll send a 6-digit verification code to your new address to confirm it's yours.",
    inputLabel: 'New email address',
    placeholder: 'you@email.com',
    hint: 'Must be different from your current address.',
    same: 'This is already your email address.',
  },
} as const;

/**
 * Two-step change of a verified phone or email: enter the new value, then prove it.
 *
 * <p>The code is sent to the value being claimed rather than the one already held, so completing
 * this is what establishes the new detail is reachable. Nothing on the account moves until the
 * second step succeeds — closing the dialog part-way leaves the old value in place.
 *
 * <p>Shared by every account that has a verified contact detail (tutor, institute, student,
 * parent), so the journey is the same wherever it is started from.
 */
export function ContactChangeDialog({ channel, currentValue, onClose, onChanged }: Props) {
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [changeId, setChangeId] = useState<number | null>(null);
  const [maskedDestination, setMasked] = useState('');
  const [busy, setBusy] = useState(false);
  const { remaining, active, start } = useCooldown();

  const copy = channel ? COPY[channel] : null;
  const isPhone = channel === 'PHONE';

  const wellFormed = isPhone ? isValidPhone(value) : isValidEmail(value);
  // Canonicalised before it is sent, exactly as at sign-up — otherwise the same number in a
  // different shape reads as a different value to the server.
  const canonical = () => (isPhone ? toE164(value)! : normalizeEmail(value));

  /**
   * Whether the new value is the one already held.
   *
   * <p>Compared canonically, not as typed: 03001234567 and +923001234567 are one number, and
   * Ali@Example.com is the address already on file. The server refuses this too — catching it
   * here saves a round trip and, more to the point, saves sending a code to an address the person
   * already reads.
   */
  const sameAsCurrent =
    wellFormed &&
    !!currentValue &&
    canonical().toLowerCase() === (isPhone ? currentValue : normalizeEmail(currentValue)).toLowerCase();

  const valid = wellFormed && !sameAsCurrent;

  const problem = value
    ? !wellFormed
      ? isPhone
        ? PHONE_ERROR
        : EMAIL_ERROR
      : sameAsCurrent
        ? copy?.same
        : undefined
    : undefined;

  const reset = () => {
    setValue('');
    setCode('');
    setChangeId(null);
    setMasked('');
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const sendCode = async () => {
    if (!channel || !valid) return;
    setBusy(true);
    try {
      const res = await accountService.startContactChange(channel, canonical());
      setChangeId(res.changeId);
      setMasked(res.maskedDestination);
      start();
      if (res.devCode) {
        toast.info('Dev verification code', { description: res.devCode, duration: 15000 });
      }
      toast.success('Code sent', { description: `We've sent a code to ${res.maskedDestination}.` });
    } catch (e) {
      toast.error('Could not send the code', { description: message(e) });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (changeId == null || code.length !== 6) return;
    setBusy(true);
    try {
      const details = await accountService.confirmContactChange(changeId, code);
      onChanged(details);
      toast.success(`Your ${copy?.label} has been updated`);
      close();
    } catch (e) {
      // A dead request cannot be rescued by another code — send them back to the first step.
      if (e instanceof ApiError && e.code === 'REGISTRATION_EXPIRED') {
        setChangeId(null);
        setCode('');
        toast.error('That request expired', { description: 'Please start again.' });
        return;
      }
      toast.error('Could not verify the code', { description: message(e) });
    } finally {
      setBusy(false);
    }
  };

  const Icon = copy?.icon ?? Mail;

  return (
    <Dialog open={channel !== null} onOpenChange={(open) => !open && close()}>
      {/* Not dismissible by clicking away or pressing Escape. A code sent to the new address lives
          on the server and cannot be recovered once this unmounts, so the two ways a dialog
          normally closes by accident would silently throw away a request the person is part-way
          through. Leaving is deliberate: the X, or Cancel. */}
      <DialogContent
        className="[&>*]:min-w-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>
            {changeId == null ? (
              copy?.lead
            ) : (
              <>
                Enter the 6-digit code we sent to{' '}
                <span className="font-medium text-foreground">{maskedDestination}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {changeId == null ? (
          <div className="space-y-4">
            {/* The detail being replaced, stated as a fact rather than buried in the paragraph
                above: it is the thing the person is checking before they type, and a verified
                value is worth showing as verified. */}
            {currentValue && (
              <StatusRow
                tone="current"
                label="Current"
                value={isPhone ? toNationalDisplay(currentValue) : currentValue}
                badge="Verified"
              />
            )}

            <div>
              <Label htmlFor="contact-new">{copy?.inputLabel}</Label>
              <Input
                id="contact-new"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={copy?.placeholder}
                inputMode={isPhone ? 'numeric' : 'email'}
                autoComplete={isPhone ? 'tel' : 'email'}
                aria-invalid={problem ? true : undefined}
                className={problem ? 'mt-1.5 border-destructive' : 'mt-1.5'}
                autoFocus
              />
              {/* The rule and the complaint occupy the same line: the rule is what you read before
                  typing, the complaint is what replaces it when you have broken it. */}
              {(problem ?? (currentValue ? copy?.hint : undefined)) && (
                <p
                  className={`mt-1.5 text-xs `}
                >
                  {problem ?? copy?.hint}
                </p>
              )}
            </div>

            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button type="button" variant="outline" className="flex-1" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="flex-[2]"
                disabled={!valid || busy}
                onClick={sendCode}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Send verification code
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <StatusRow tone="pending" icon={Icon} label="Code sent to" value={maskedDestination} />

            <div>
              <OtpInput size="sm" onChange={setCode} onComplete={setCode} />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Didn&rsquo;t get it?{' '}
                {active ? (
                  // Stated as a time rather than a dead button: a disabled control that says only
                  // "Resend code" reads as broken.
                  <span className="font-medium tabular-nums">
                    Resend in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendCode}
                    className="font-semibold text-primary hover:underline"
                  >
                    Resend code
                  </button>
                )}
              </p>
            </div>

            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button type="button" variant="outline" className="flex-1" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="flex-[2]"
                disabled={code.length !== 6 || busy}
                onClick={confirm}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify and update
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One line of standing information inside the dialog — the detail being replaced, or where the
 * code went. A bordered row rather than prose so the value is scannable and can be checked at a
 * glance against what the person expects.
 */
function StatusRow({
  tone,
  icon: Icon,
  label,
  value,
  badge,
}: {
  tone: 'current' | 'pending';
  icon?: typeof Mail;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-secondary/40 px-3 py-2.5">
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            tone === 'current' ? 'bg-emerald-500' : 'bg-muted-foreground'
          }`}
        />
      )}
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      {/* min-w-0 + truncate: a long address must shorten rather than push the badge out of the
          card or force the dialog wider than the viewport on a phone. */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium" title={value}>
        {value}
      </span>
      {badge && (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide leading-none text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          {badge}
        </span>
      )}
    </div>
  );
}

function message(e: unknown): string {
  if (e instanceof ApiError || e instanceof Error) return e.message;
  return 'Please try again.';
}
