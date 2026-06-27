import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Phone, Mail } from 'lucide-react';
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
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useAuthStore } from '@/store/authStore';
import { CITIES } from '@/constants';
import { toast } from '@/components/ui/sonner';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  city: z.string().min(1, 'Select your city'),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});
type FormValues = z.infer<typeof schema>;

export default function StudentSignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormValues) => {
    await signup({ name: v.name, phone: v.phone, email: v.email, role: 'parent', city: v.city });
    toast.success('Account created!', { description: 'Verify your phone to get started.' });
    navigate('/verify-otp', { state: { phone: v.phone } });
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
      <SocialButtons />
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
