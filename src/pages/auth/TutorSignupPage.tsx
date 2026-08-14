import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  MailCheck,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { OtpInput } from '@/components/auth/OtpInput';
import { useAuthStore } from '@/store/authStore';
import { authService, type VerificationChannel } from '@/services/authService';
import { ApiError } from '@/api/client';
import { isStrongPassword, passwordChecklist } from '@/lib/password';
import { isValidPhone, toE164, toMaskedDisplay, PHONE_ERROR } from '@/lib/phone';
import { maskEmail, isValidEmail, normalizeEmail, EMAIL_ERROR } from '@/lib/email';
import { useCooldown } from '@/hooks/useCooldown';
import { toast } from '@/components/ui/sonner';

const STEPS = ['Account', 'Verify'];


export default function TutorSignupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [tutorId, setTutorId] = useState<number | null>(null);
  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const setOnboarding = useAuthStore((s) => s.setOnboarding);
  const clearOnboarding = useAuthStore((s) => s.clearOnboarding);
  const navigate = useNavigate();

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const accountValid =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 1 &&
    isValidEmail(form.email) &&
    isValidPhone(form.phone) &&
    isStrongPassword(form.password) &&
    passwordsMatch;

  // Surfaces the dev-only OTP codes (returned by the backend in dev) so the flow is testable.
  const showDevCodes = (sms?: string, email?: string) => {
    if (sms || email) {
      toast.info('Dev verification codes', {
        description: `SMS: ${sms ?? '—'}  ·  Email: ${email ?? '—'}`,
        duration: 15000,
      });
    }
  };

  // Step 1 → register (email + phone); backend sends SMS + email OTPs.
  const sendCodes = async () => {
    setSending(true);
    try {
      const email = normalizeEmail(form.email);
      // Non-null: accountValid gates this step and already required a convertible number.
      const phone = toE164(form.phone)!;
      const challenge = await authService.registerTutor({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phone,
        password: form.password,
      });
      setTutorId(challenge.tutorId);
      setOnboarding({
        tutorId: challenge.tutorId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        password: form.password,
      });
      toast.success('Codes sent', {
        description: 'Check your SMS and email for the 6-digit codes.',
      });
      showDevCodes(challenge.devPhoneCode, challenge.devEmailCode);
      setStep(1);
    } catch (e) {
      // Same conflict as the student form: one canonical value means one registration, however
      // the number was typed.
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Already registered', {
          description: 'That phone number or email already has an account. Try logging in.',
        });
        return;
      }
      toast.error('Could not start registration', { description: errorMessage(e) });
    } finally {
      setSending(false);
    }
  };

  const resend = async (channel: VerificationChannel) => {
    if (tutorId == null) return;
    try {
      const challenge = await authService.resendTutorOtp({ tutorId, channel });
      showDevCodes(challenge.devPhoneCode, challenge.devEmailCode);
      // Says the old code is dead. Otherwise someone who receives the replacement while still
      // holding the first message has two codes and no reason to prefer either.
      toast.success(`${channel === 'PHONE' ? 'SMS' : 'Email'} code resent`, {
        description: 'Your previous code is no longer valid.',
      });
    } catch (e) {
      toast.error('Could not resend code', { description: errorMessage(e) });
    }
  };

  // Step 2 → verify both codes. The account is activated (with an empty profile); we congratulate
  // the tutor and send them to the login page, where they'll build their profile from the dashboard.
  const verifyAndContinue = async () => {
    if (tutorId == null || smsCode.length !== 6 || emailCode.length !== 6) {
      toast.error('Invalid codes', { description: 'Enter both 6-digit codes to continue.' });
      return;
    }
    setVerifying(true);
    try {
      await authService.verifyTutorOtp({ tutorId, phoneCode: smsCode, emailCode });
      clearOnboarding();
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3500);
    } catch (e) {
      toast.error('Verification failed', { description: errorMessage(e) });
      setVerifying(false);
    }
  };

  if (done) {
    return (
      <div>
        <AuthHeader title="You’re all set" subtitle="Your tutor account has been created." />
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
            <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Congratulations! 🎉</h2>
          <p className="max-w-sm text-muted-foreground">
            Your phone and email are verified. Please log in — you’ll set up your tutor profile from
            your dashboard.
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Redirecting you to log in…
          </div>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Go to login now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Become a verified tutor"
        subtitle="Verify your details, then build your profile."
      />

      {/* Stepper */}
      <div className="mb-5 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  i < step && 'border-brand-500 bg-brand-500 text-white',
                  i === step && 'border-brand-500 text-brand-600',
                  i > step && 'border-input text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1.5 text-xs font-medium">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1', i < step ? 'bg-brand-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Account details (all required) */}
      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" icon={User}>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Ayesha"
                className="pl-9"
              />
            </Field>
            <Field label="Last name" icon={User}>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Khan"
                className="pl-9"
              />
            </Field>
          </div>
          {/* Says so, rather than only disabling Continue. An invalid address used to leave the
              button dead with nothing to explain why — and this is the field a verification code
              has to reach, so being wrong here is not recoverable later. */}
          <Field
            label="Email"
            icon={Mail}
            error={form.email && !isValidEmail(form.email) ? EMAIL_ERROR : undefined}
          >
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              autoComplete="email"
              className="pl-9"
            />
          </Field>
          {/* The error goes through Field's own prop rather than inline beneath the input: Field
              centres the icon on the wrapper around its children, so anything rendered in there
              alongside the input pulls the icon below the input's centre line. The placeholder
              carries the format, and the message only appears once there is something wrong. */}
          <Field
            label="Phone number"
            icon={Phone}
            error={form.phone && !isValidPhone(form.phone) ? PHONE_ERROR : undefined}
          >
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="03001234567"
              inputMode="numeric"
              autoComplete="tel"
              className="pl-9"
            />
          </Field>

          <Field label="Password" icon={Lock}>
            <Input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a strong password"
              className="pl-9 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          {form.password.length > 0 && <PasswordChecklist password={form.password} />}

          <Field label="Confirm password" icon={Lock}>
            <Input
              type={showPw ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              className="pl-9"
              autoComplete="new-password"
            />
          </Field>
          {form.confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}

          <p className="text-xs text-muted-foreground">
            We’ll send a verification code to both your phone and email.
          </p>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={sendCodes}
            disabled={!accountValid || sending}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Verification Codes <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* Step 2 — Verify both codes */}
      {step === 1 && (
        <div className="space-y-3">
          {/* States both destinations once, up front, so the two blocks below are a task list
              rather than the first news of where anything was sent. Masked: enough of each to be
              recognised by the person who owns it, not enough to be learned by anyone else. */}
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            We’ve sent a 6-digit code to your phone{' '}
            <span className="font-semibold text-foreground">
              {toMaskedDisplay(toE164(form.phone))}
            </span>{' '}
            and email <span className="font-semibold text-foreground">{maskEmail(form.email)}</span>
          </p>

          <OtpBlock
            icon={MessageSquare}
            title="SMS code"
            // Masked, and in the local form: the code went to the canonical number, but people
            // recognise their own number as they write it, not as E.164.
            sentTo={toMaskedDisplay(toE164(form.phone))}
            onChange={setSmsCode}
            onResend={() => resend('PHONE')}
          />
          <OtpBlock
            icon={MailCheck}
            title="Email code"
            sentTo={maskEmail(form.email)}
            onChange={setEmailCode}
            onResend={() => resend('EMAIL')}
          />

          <div className="flex gap-3 pt-1">
            <Button variant="outline" size="lg" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={verifyAndContinue}
              disabled={smsCode.length !== 6 || emailCode.length !== 6 || verifying}
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}

/**
 * The outstanding password requirements.
 *
 * <p>Withdraws entirely once the password satisfies all of them. The list is instruction, and
 * instruction that has been followed is just clutter sitting between the field and the button —
 * its disappearance is itself the confirmation that nothing is left to do. It stays away until
 * there is something to say again, so an edit that breaks a rule brings it straight back.
 */
function PasswordChecklist({ password }: { password: string }) {
  if (isStrongPassword(password)) return null;

  return (
    <ul className="grid grid-cols-1 gap-1 rounded-xl border bg-secondary/40 p-3 sm:grid-cols-2">
      {passwordChecklist(password).map((rule) => (
        <li
          key={rule.label}
          className={cn(
            'flex items-center gap-1.5 text-[11px]',
            rule.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {rule.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: typeof User;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {/* Only the control belongs in here. The icon is centred on this box, so it tracks the
          input's centre line only while the input is the sole thing in it. */}
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function OtpBlock({
  icon: Icon,
  title,
  sentTo,
  onChange,
  onResend,
}: {
  icon: typeof MessageSquare;
  title: string;
  sentTo: string;
  onChange: (code: string) => void;
  onResend: () => void;
}) {
  // The clock starts on mount, which is the moment this block appears — i.e. the moment the first
  // code was sent. There is no window in which resend is available before the code has had a
  // chance to arrive.
  const { remaining, active, start } = useCooldown();
  const [resetToken, setResetToken] = useState(0);

  const resend = () => {
    onResend();
    start();
    // Empties the boxes and drops the caret back in the first one. The code that was being typed
    // belongs to the message that was just superseded, so leaving it there would offer the person
    // a code the server has already discarded.
    setResetToken((n) => n + 1);
  };

  return (
    <div className="rounded-xl border bg-card p-3 shadow-soft">
      {/* The heading is pure identity — which channel this is, and where it went. The action that
          used to share this row has moved below the boxes: resending is what you reach for after
          looking for a code and not finding one, which is a decision made at the end of the block
          rather than before it. */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold">{title}</div>
          <div className="truncate text-[11px] text-muted-foreground">Sent to {sentTo || '—'}</div>
        </div>
      </div>

      <OtpInput size="sm" resetToken={resetToken} onChange={onChange} />

      <div className="mt-2.5 text-center text-[11px] text-muted-foreground">
        Didn’t get it?{' '}
        {active ? (
          // The wait is stated as a time, not as a greyed-out button with no explanation. A
          // disabled control that says only "Resend code" reads as broken.
          <span className="font-medium tabular-nums">
            Resend in {formatCountdown(remaining)}
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="font-semibold text-primary hover:underline"
          >
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}

/** 60 → "1:00", 9 → "0:09". Seconds alone read as a bigger number than they are at a minute. */
function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
