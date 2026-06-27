import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

const schema = z.object({
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard/student';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Login failed', { description: 'Please check your credentials and try again.' });
    }
  };

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
      <SocialButtons />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" placeholder="+92 300 1234567" className="pl-9" {...register('phone')} />
          </div>
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
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

      <div className="mt-6 rounded-xl border bg-secondary/40 p-3 text-center text-xs text-muted-foreground">
        Are you a parent? You can also{' '}
        <Link to="/verify-otp" className="font-semibold text-primary hover:underline">
          log in with a phone OTP
        </Link>{' '}
        — no password needed.
      </div>
    </div>
  );
}
