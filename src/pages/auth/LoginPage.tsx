import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useAuthStore } from '@/store/authStore';
import { normalizeIdentifier } from '@/lib/phone';
import { dashboardHome } from '@/constants/navigation';
import { toast } from '@/components/ui/sonner';
import type { User } from '@/types';

const schema = z.object({
  // Accepts an email OR a phone number (students/parents may log in with phone).
  email: z.string().min(3, 'Enter your email or phone'),
  // Login only checks the field is present — it must NOT reveal the password policy
  // (min length, etc.). The server answers with a generic "invalid credentials".
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const login = useAuthStore((s) => s.login);
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const navigate = useNavigate();
  const location = useLocation();
  // Set when the session ended on its own rather than by signing out. Without it an expiry looks
  // identical to having never signed in, and the person is left guessing why they are back here.
  const sessionEndedMessage = (location.state as { sessionEndedMessage?: string })
    ?.sessionEndedMessage;

  // When the account has 2FA on, login returns a challenge and we switch to the code step.
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  /**
   * Where a signed-in account belongs.
   *
   * <p>Every role resolves through {@link dashboardHome}, the same map the navigation and the
   * route guard read, so a role can never be sent somewhere the guard will bounce it out of.
   * Institutes used to fall through to {@code from} — which defaults to the tutor dashboard —
   * and were thrown straight back out by the guard on their first successful login.
   *
   * <p>Tutors keep their one exception: they land on the profile page rather than the dashboard
   * root, because a new tutor's first task is completing their profile.
   */
  const goToDashboard = (user: User) => {
    const dest = user.role === 'tutor' ? '/dashboard/tutor/profile' : dashboardHome(user.role);
    navigate(dest, { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // The identifier is canonicalised before it is sent, so signing in with 03001234567 reaches
      // the account registered as +923001234567. Without this, accepting three input formats at
      // registration would simply move the problem to the login form. Emails and anything that is
      // not a valid number pass through untouched for the server to judge.
      const result = await login({ ...values, email: normalizeIdentifier(values.email) });
      if (result.twoFactorRequired) {
        setChallengeId(result.challengeId);
        toast.success('Check your email', { description: 'We sent you a 6-digit login code.' });
        return;
      }
      toast.success('Welcome back!');
      goToDashboard(result.user);
    } catch {
      toast.error('Login failed', { description: 'Please check your credentials and try again.' });
    }
  };

  const onVerify = async () => {
    if (!challengeId || code.trim().length !== 6) return;
    setVerifying(true);
    try {
      const user = await verifyTwoFactor(challengeId, code.trim());
      toast.success('Welcome back!');
      goToDashboard(user);
    } catch (e) {
      toast.error('Verification failed', {
        description: e instanceof Error ? e.message : 'That code is incorrect or expired.',
      });
    } finally {
      setVerifying(false);
    }
  };

  // ---- Two-factor code step ----
  if (challengeId) {
    return (
      <div>
        <AuthHeader title="Two-factor authentication" subtitle="Enter the 6-digit code we emailed you." />
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              className="text-center text-lg tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && onVerify()}
            />
          </div>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={verifying || code.length !== 6}
            onClick={onVerify}
          >
            {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setChallengeId(null);
              setCode('');
            }}
            className="w-full text-center text-xs font-medium text-muted-foreground hover:text-primary"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Welcome back"
        subtitle={
          <>
            New to TopTutor?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </>
        }
      />

      {/* Above the form, not a toast: a toast disappears, and this is the answer to "why am I
          looking at the login page again?" — which is asked after the toast would have gone. */}
      {sessionEndedMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{sessionEndedMessage}</span>
        </div>
      )}

      <SocialButtons />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email or phone</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="text"
              placeholder="you@email.com or 03001234567"
              autoComplete="username"
              className="pl-9"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>

      <div className="mt-4 rounded-xl border bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
        Are you a parent? You can also{' '}
        <Link to="/verify-otp" className="font-semibold text-primary hover:underline">
          log in with a phone OTP
        </Link>{' '}
        — no password needed.
      </div>
    </div>
  );
}
