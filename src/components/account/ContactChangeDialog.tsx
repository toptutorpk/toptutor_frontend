import { useState } from 'react';
import { Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
    inputLabel: 'New phone number',
    placeholder: '03001234567',
  },
  EMAIL: {
    label: 'email address',
    title: 'Change your email address',
    icon: Mail,
    inputLabel: 'New email address',
    placeholder: 'you@email.com',
  },
} as const;

/**
 * Two-step change of a verified phone or email: enter the new value, then prove it.
 *
 * <p>The code is sent to the value being claimed rather than the one already held, so completing
 * this is what establishes the new detail is reachable. Nothing on the account moves until the
 * second step succeeds — closing the dialog part-way leaves the old value in place.
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

  const valid = isPhone ? isValidPhone(value) : isValidEmail(value);
  // Canonicalised before it is sent, exactly as at sign-up — otherwise the same number in a
  // different shape reads as a different value to the server.
  const canonical = () => (isPhone ? toE164(value)! : normalizeEmail(value));

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

  return (
    <Dialog open={channel !== null} onOpenChange={(open) => !open && close()}>
      {/* Dismissible only by the X. A code sent to the new address lives on the server and cannot be
          recovered once this unmounts, so the two ways a dialog normally closes by accident — a
          click landing outside it, a stray Escape — would silently throw away a request the person
          is part-way through. Closing has to be something they chose. */}
      <DialogContent
        className="[&>*]:min-w-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>
            {changeId == null ? (
              <>
                Your {copy?.label} is verified, so we'll send a code to the new one to confirm it's
                yours.
                {currentValue && (
                  <>
                    {' '}
                    Currently{' '}
                    <span className="font-medium text-foreground">
                      {isPhone ? toNationalDisplay(currentValue) : currentValue}
                    </span>
                    .
                  </>
                )}
              </>
            ) : (
              <>
                Enter the 6-digit code we sent to{' '}
                <span className="font-medium text-foreground">{maskedDestination}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {changeId == null ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-new">{copy?.inputLabel}</Label>
              <Input
                id="contact-new"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={copy?.placeholder}
                inputMode={isPhone ? 'numeric' : 'email'}
                autoComplete={isPhone ? 'tel' : 'email'}
                autoFocus
              />
              {value && !valid && (
                <p className="text-xs text-red-500">{isPhone ? PHONE_ERROR : EMAIL_ERROR}</p>
              )}
            </div>
            <Button
              variant="gradient"
              className="w-full"
              disabled={!valid || busy}
              onClick={sendCode}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification code
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <OtpInput size="sm" onChange={setCode} onComplete={setCode} />
            <Button
              variant="gradient"
              className="w-full"
              disabled={code.length !== 6 || busy}
              onClick={confirm}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify and update
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Didn't get it?{' '}
              {active ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
}

function message(e: unknown): string {
  if (e instanceof ApiError || e instanceof Error) return e.message;
  return 'Please try again.';
}
