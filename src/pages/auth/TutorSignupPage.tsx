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
import { toast } from '@/components/ui/sonner';

const STEPS = ['Account', 'Verify'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strips spaces/dashes so the phone matches the backend's E.164-ish format. */
function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

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

  const setOnboarding = useAuthStore((s) => s.setOnboarding);
  const navigate = useNavigate();

  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const accountValid =
    form.firstName.trim().length >= 2 &&
    form.lastName.trim().length >= 1 &&
    EMAIL_RE.test(form.email) &&
    normalizePhone(form.phone).length >= 8 &&
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
      const email = form.email.trim().toLowerCase();
      const phone = normalizePhone(form.phone);
      const challenge = await authService.registerTutor({ email, phone, password: form.password });
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
      toast.success(`${channel === 'PHONE' ? 'SMS' : 'Email'} code resent`);
    } catch (e) {
      toast.error('Could not resend code', { description: errorMessage(e) });
    }
  };

  // Step 2 → verify both codes, then head to profile creation.
  const verifyAndContinue = async () => {
    if (tutorId == null || smsCode.length !== 6 || emailCode.length !== 6) {
      toast.error('Invalid codes', { description: 'Enter both 6-digit codes to continue.' });
      return;
    }
    setVerifying(true);
    try {
      await authService.verifyTutorOtp({ tutorId, phoneCode: smsCode, emailCode });
      toast.success('Phone & email verified!', { description: 'Let’s set up your tutor profile.' });
      navigate('/signup/tutor/profile');
    } catch (e) {
      toast.error('Verification failed', { description: errorMessage(e) });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <AuthHeader
        title="Become a verified tutor"
        subtitle="Verify your details, then build your profile."
      />

      {/* Stepper */}
      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
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
        <div className="space-y-4">
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
          <Field label="Email" icon={Mail}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              className="pl-9"
            />
          </Field>
          <Field label="Phone number" icon={Phone}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+923001234567"
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
          <OtpBlock
            icon={MessageSquare}
            title="SMS code"
            sentTo={form.phone}
            onChange={setSmsCode}
            onResend={() => resend('PHONE')}
          />
          <OtpBlock
            icon={MailCheck}
            title="Email code"
            sentTo={form.email}
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

function PasswordChecklist({ password }: { password: string }) {
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
  children,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
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
  const [resent, setResent] = useState(false);
  return (
    <div className="rounded-xl border bg-card p-3 shadow-soft">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">Sent to {sentTo || '—'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onResend();
            setResent(true);
            setTimeout(() => setResent(false), 3000);
          }}
          className="shrink-0 text-[11px] font-medium text-primary hover:underline disabled:opacity-60"
          disabled={resent}
        >
          {resent ? 'Resent' : 'Resend'}
        </button>
      </div>
      <OtpInput size="sm" onChange={onChange} />
    </div>
  );
}
