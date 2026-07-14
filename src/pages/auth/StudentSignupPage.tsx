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
    phone: z.string().min(7, 'Enter a valid phone number'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
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

function normalizePhone(raw: string) {
  return raw.replace(/[\s-]/g, '');
}

export default function StudentSignupPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'STUDENT' } });

  const role = watch('role');

  const onSubmit = async (v: FormValues) => {
    try {
      const user = await authService.registerAccount({
        role: v.role,
        fullName: v.name.trim(),
        phone: normalizePhone(v.phone),
        email: v.email || undefined,
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
      <div className="mb-5 grid grid-cols-2 gap-3">
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
              'flex flex-col items-center gap-1 rounded-2xl border-2 p-4 text-center transition-colors',
              role === o.value
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-input hover:border-brand-200',
            )}
          >
            <o.icon className="h-6 w-6" />
            <span className="text-sm font-bold">{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.sub}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.name?.message} icon={User}>
          <Input placeholder="Ali Raza" className="pl-9" {...register('name')} />
        </Field>
        <Field label="Phone number" error={errors.phone?.message} icon={Phone}>
          <Input placeholder="+92 300 1234567" className="pl-9" {...register('phone')} />
        </Field>
        <Field label="Email (optional)" error={errors.email?.message} icon={Mail}>
          <Input placeholder="you@email.com" className="pl-9" {...register('email')} />
        </Field>
        <div className="space-y-1.5">
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
        <Field label="Password" error={errors.password?.message} icon={Lock}>
          <Input type="password" placeholder="Create a strong password" className="pl-9" {...register('password')} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message} icon={Lock}>
          <Input type="password" placeholder="Re-enter your password" className="pl-9" {...register('confirmPassword')} />
        </Field>

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

      <p className="mt-6 text-center text-sm text-muted-foreground">
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
