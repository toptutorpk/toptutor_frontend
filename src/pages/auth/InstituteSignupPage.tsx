import { forwardRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Building2,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  MailCheck,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { OtpChannelBlock } from '@/components/auth/OtpChannelBlock';
import { PasswordChecklist } from '@/components/auth/PasswordChecklist';
import { useAuthStore } from '@/store/authStore';
import { isValidPhone, toE164, toMaskedDisplay, PHONE_ERROR } from '@/lib/phone';
import { isValidEmail, maskEmail, normalizeEmail, EMAIL_ERROR } from '@/lib/email';
import { authService, type VerificationChannel } from '@/services/authService';
import { ApiError, getAccessToken } from '@/api/client';
import { isStrongPassword, PASSWORD_MIN_LENGTH } from '@/lib/password';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

const STEPS = ['Account', 'Verify'];

/**
 * Only what is needed to create the account.
 *
 * <p>Email is required where a learner's is optional: every institute is invoiced. Everything else
 * — signatory, campus address, legal identity — is asked for on the profile afterwards, where it
 * sits beside the documents that evidence it.
 *
 * <p>Every rule here is the tutor form's rule, from the same helpers: {@code isValidPhone} (the
 * three accepted Pakistani spellings, one canonical value), {@code isValidEmail}, and
 * {@code isStrongPassword} (which mirrors the backend's {@code @StrongPassword}). Sharing the
 * helpers rather than restating the rules is what stops the two sign-ups drifting apart.
 */
const schema = z
  .object({
    instituteName: z.string().trim().min(2, 'Enter your institute name'),
    phone: z.string().refine(isValidPhone, PHONE_ERROR),
    email: z.string().refine(isValidEmail, EMAIL_ERROR),
    password: z
      .string()
      .refine(
        isStrongPassword,
        `Use ${PASSWORD_MIN_LENGTH}+ characters with an upper-case letter, a lower-case letter, a number and a symbol`,
      ),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function InstituteSignupPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  // Step 0 is the form, step 1 the two codes. The account does not exist until step 1 passes.
  const [step, setStep] = useState(0);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  // The destinations are remembered from what was typed and masked here rather than read back off
  // the response: the codes went to exactly these, so step 2 can always say where to look.
  const [sentToPhone, setSentToPhone] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = watch('password') ?? '';
  const confirmPassword = watch('confirmPassword') ?? '';
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Surfaces the dev-only OTP codes (returned by the backend in dev) so the flow is testable
  // without a live SMS gateway — the same affordance the tutor sign-up has.
  const showDevCodes = (sms?: string, email?: string) => {
    if (sms || email) {
      toast.info('Dev verification codes', {
        description: `SMS: ${sms ?? '—'}  ·  Email: ${email ?? '—'}`,
        duration: 15000,
      });
    }
  };

  const onSubmit = async (v: FormValues) => {
    try {
      const challenge = await authService.registerInstitute({
        instituteName: v.instituteName.trim(),
        // Non-null: the schema has already refused anything toE164 cannot convert.
        phone: toE164(v.phone)!,
        email: normalizeEmail(v.email),
        password: v.password,
        acceptedTerms: true,
      });
      setRegistrationId(challenge.registrationId);
      // Masked in the local form people recognise their own number in, not E.164.
      setSentToPhone(toMaskedDisplay(toE164(v.phone)));
      setSentToEmail(maskEmail(normalizeEmail(v.email)));
      setStep(1);
      toast.success('Codes sent', {
        description: 'Check your SMS and email for the 6-digit codes.',
      });
      showDevCodes(challenge.devPhoneCode, challenge.devEmailCode);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // The server's message names which identifier clashed, so it is answered on that field
        // rather than as a banner the person has to map back to an input themselves.
        const onPhone = e.message.toLowerCase().includes('phone');
        setError(onPhone ? 'phone' : 'email', {
          message: onPhone
            ? 'This phone number is already registered. Try logging in.'
            : 'This email is already registered. Try logging in.',
        });
        toast.error('That account already exists');
        return;
      }
      toast.error('Could not send codes', { description: errorMessage(e) });
    }
  };

  const resend = async (channel: VerificationChannel) => {
    if (registrationId == null) return;
    try {
      const challenge = await authService.resendInstituteOtp({ registrationId, channel });
      showDevCodes(challenge.devPhoneCode, challenge.devEmailCode);
      // Says the old code is dead. Otherwise someone who receives the replacement while still
      // holding the first message has two codes and no reason to prefer either.
      toast.success(`${channel === 'PHONE' ? 'SMS' : 'Email'} code resent`, {
        description: 'Your previous code is no longer valid.',
      });
    } catch (e) {
      if (isExpiredSignUp(e)) {
        restartExpiredSignUp();
        return;
      }
      toast.error('Could not resend code', { description: errorMessage(e) });
    }
  };

  const verifyAndContinue = async () => {
    if (registrationId == null || smsCode.length !== 6 || emailCode.length !== 6) {
      toast.error('Invalid codes', { description: 'Enter both 6-digit codes to continue.' });
      return;
    }
    setVerifying(true);
    try {
      const user = await authService.verifyInstituteOtp({
        registrationId,
        phoneCode: smsCode,
        emailCode,
      });
      // Unlike the tutor flow this signs the institute straight in: verification creates the
      // account AND issues tokens, because the next thing an institute must do is upload its
      // registration documents, which is a signed-in task.
      setSession(user, getAccessToken() ?? '');
      toast.success('Institute account created', {
        description: 'Next: complete your profile and upload your registration documents.',
      });
      navigate('/dashboard/institute/registration', { replace: true });
    } catch (e) {
      if (isExpiredSignUp(e)) {
        restartExpiredSignUp();
        return;
      }
      toast.error('Verification failed', { description: errorMessage(e) });
      setVerifying(false);
    }
  };

  /**
   * A sign-up left long enough is discarded server-side, so the id this tab is holding no longer
   * refers to anything. Sending them back to the form is the only useful move — react-hook-form
   * still holds the details, so it is a re-submit rather than a re-type, and the email is free
   * again precisely because nothing was ever registered under it.
   */
  const restartExpiredSignUp = () => {
    setRegistrationId(null);
    setSmsCode('');
    setEmailCode('');
    setVerifying(false);
    setStep(0);
    toast.error('This sign-up expired', {
      description: 'Your details are still here — send new codes to continue.',
    });
  };

  return (
    <div>
      {/* Constant across both steps, like tutor sign-up: the heading names the journey, and the
          stepper below is what says where you are in it. */}
      <AuthHeader
        title="Become a verified institute"
        subtitle="Verify your details, then complete your registration."
      />

      {/* Stepper — same shape as tutor sign-up, so the two onboarding journeys read as one
          product rather than two that were built separately. */}
      <div className="mb-5 flex items-center">
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

      {step === 0 && (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field
              id="instituteName"
              label="Institute name"
              icon={Building2}
              placeholder="Beaconhouse School System — DHA Campus"
              error={errors.instituteName?.message}
              {...register('instituteName')}
            />

            <Field
              id="email"
              label="Institute email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="admin@yourinstitute.edu.pk"
              error={errors.email?.message}
              {...register('email')}
            />

            <Field
              id="phone"
              label="Phone"
              icon={Phone}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="03001234567"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Field
              id="password"
              label="Password"
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              error={errors.password?.message}
              className="pr-10"
              adornment={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />

            {/* Live, per-rule, and gone the moment the password satisfies all of them — the same
                checklist the tutor form shows, from the same component. */}
            {password.length > 0 && <PasswordChecklist password={password} />}

            <Field
              id="confirmPassword"
              label="Confirm password"
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              // Answered as you type rather than only on submit: a mismatch you are told about at
              // the end is a mismatch you have to hunt for.
              error={errors.confirmPassword?.message ?? (mismatch ? 'Passwords do not match' : undefined)}
              {...register('confirmPassword')}
            />

            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="terms"
                onCheckedChange={(v) =>
                  setValue('terms', Boolean(v) as true, { shouldValidate: true })
                }
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal leading-snug text-muted-foreground"
              >
                I confirm I am authorised to register this institute and accept the{' '}
                <Link to="/terms" className="font-medium text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

            <p className="text-xs text-muted-foreground">
              We&rsquo;ll send a verification code to both your phone and email.
            </p>
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send verification codes
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {/* Both destinations stated once, up front, so the blocks below are a task list rather
              than the first news of where anything went. Masked: enough for the owner to
              recognise, not enough for anyone else to learn. */}
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            We&rsquo;ve sent a 6-digit code to your phone{' '}
            <span className="font-semibold text-foreground">{sentToPhone}</span> and email{' '}
            <span className="font-semibold text-foreground">{sentToEmail}</span>
          </p>

          <OtpChannelBlock
            icon={MessageSquare}
            title="SMS code"
            sentTo={sentToPhone}
            onChange={setSmsCode}
            onResend={() => resend('PHONE')}
          />
          <OtpChannelBlock
            icon={MailCheck}
            title="Email code"
            sentTo={sentToEmail}
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
              Verify &amp; continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Whether the failure means the staged sign-up is gone rather than the code being wrong.
 *
 * <p>A stale code is OTP_EXPIRED and wants a resend; a sign-up that has been swept away is
 * REGISTRATION_EXPIRED (410 Gone) and wants the form back, because there is nothing left to resend
 * against. They are separate codes precisely so this can be decided without reading the message.
 */
function isExpiredSignUp(e: unknown): boolean {
  return e instanceof ApiError && e.code === 'REGISTRATION_EXPIRED';
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}

/**
 * A labelled input with a leading icon, matching the other auth forms.
 *
 * <p>Forwards its ref: `register()` hands back a ref callback, and a plain function component would
 * swallow it — the field would render but never register, so the form would submit empty.
 */
const Field = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    label: string;
    icon: typeof Building2;
    error?: string;
    hint?: string;
    /** Rendered inside the input wrapper — the password eye toggle, positioned absolutely. */
    adornment?: React.ReactNode;
  }
>(function Field({ id, label, icon: Icon, error, hint, adornment, className, ...props }, ref) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          id={id}
          className={cn('pl-9', error && 'border-destructive', className)}
          {...props}
        />
        {adornment}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
