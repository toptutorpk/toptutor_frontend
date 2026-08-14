import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Phone, Mail, Lock, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useAuthStore } from '@/store/authStore';
import { isValidPhone, toE164, PHONE_ERROR } from '@/lib/phone';
import { isValidEmail, normalizeEmail, EMAIL_ERROR } from '@/lib/email';
import { authService } from '@/services/authService';
import { ApiError, getAccessToken } from '@/api/client';
import { CITIES } from '@/constants';
import { isStrongPassword } from '@/lib/password';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

const schema = z
  .object({
    role: z.enum(['STUDENT', 'PARENT']),
    name: z.string().min(2, 'Please enter your full name'),
    phone: z.string().refine(isValidPhone, PHONE_ERROR),
    // Optional here, so an empty string stays acceptable; anything actually typed must be a real
    // address. zod's own .email() is looser than the shared rule — it accepts a domain label
    // ending in a hyphen — and one validator across the app beats two that nearly agree.
    email: z.string().refine((v) => v === '' || isValidEmail(v), EMAIL_ERROR).optional(),
    city: z.string().min(1, 'Select your city'),
    password: z.string().refine(isStrongPassword, 'Use 8+ chars with upper, lower, number & symbol'),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type FormValues = z.infer<typeof schema>;

export default function StudentSignupPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'STUDENT' } });

  const role = watch('role');

  const onSubmit = async (v: FormValues) => {
    try {
      const user = await authService.registerAccount({
        role: v.role,
        fullName: v.name.trim(),
        // Non-null: the schema has already refused anything toE164 cannot convert.
        phone: toE164(v.phone)!,
        email: v.email ? normalizeEmail(v.email) : undefined,
        city: v.city,
        password: v.password,
        acceptedTerms: true,
      });
      setSession(user, getAccessToken() ?? '');
      toast.success('Account created!', {
        description: v.role === 'PARENT' ? 'Add your children from your dashboard.' : 'Welcome to TopTutor.',
      });
      navigate('/dashboard/student', { replace: true });
    } catch (e) {
      // A number already registered comes back as a conflict. Because the three input formats all
      // canonicalise to one value, this fires whichever way the person typed it — which is the
      // point of normalising before the request rather than after it. It is answered on the field
      // itself, so the form does not have to be re-read to find out what is wrong.
      if (e instanceof ApiError && e.status === 409) {
        setError('phone', { message: 'This phone number is already registered. Try logging in.' });
        toast.error('That phone number is already registered');
        return;
      }
      toast.error('Could not create account', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    }
  };

  return (
    <div>
      <AuthHeader
        title="Create your account"
        subtitle={
          <>
            For parents & students.{' '}
            <Link to="/signup/tutor" className="font-semibold text-primary hover:underline">
              Sign up as a tutor
            </Link>
          </>
        }
      />

      {/* Role toggle */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {(
          [
            { value: 'STUDENT', label: "I'm a Student", sub: 'Learn for myself', icon: GraduationCap },
            { value: 'PARENT', label: "I'm a Parent", sub: 'Book for my child', icon: Users },
          ] as const
        ).map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setValue('role', o.value, { shouldValidate: true })}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-2xl border-2 p-2.5 text-center transition-colors',
              role === o.value
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-input hover:border-brand-200',
            )}
          >
            <o.icon className="h-5 w-5" />
            <span className="text-sm font-bold">{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.sub}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
        <Field label="Full name" error={errors.name?.message} icon={User}>
          <Input placeholder="Ali Raza" className="pl-9" {...register('name')} />
        </Field>
        <Field label="Phone number" error={errors.phone?.message} icon={Phone}>
          {/* The placeholder carries the format on its own — a standing hint below the field is
              permanent clutter for a rule most people satisfy without reading it, and the error
              message states it in full for anyone who does not. It also has to be the only child
              here: Field centres the icon on this wrapper, so a second element inside it drags the
              icon off the input's centre line. */}
          <Input
            placeholder="03001234567"
            inputMode="numeric"
            autoComplete="tel"
            className="pl-9"
            {...register('phone')}
          />
        </Field>
        <Field label="Email (optional)" error={errors.email?.message} icon={Mail}>
          <Input placeholder="you@email.com" className="pl-9" {...register('email')} />
        </Field>
        <div className="space-y-1">
          <Label>City</Label>
          <Select onValueChange={(v) => setValue('city', v, { shouldValidate: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={errors.password?.message} icon={Lock}>
            <Input type="password" placeholder="Create password" className="pl-9" {...register('password')} />
          </Field>
          <Field label="Confirm password" error={errors.confirmPassword?.message} icon={Lock}>
            <Input type="password" placeholder="Re-enter password" className="pl-9" {...register('confirmPassword')} />
          </Field>
        </div>

        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox
            className="mt-0.5"
            onCheckedChange={(v) => setValue('terms', Boolean(v) as true, { shouldValidate: true })}
          />
          <span className="text-muted-foreground">
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
