import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

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
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard/tutor';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await login(values);
      toast.success('Welcome back!');
      // Route to the right dashboard by role.
      const dest =
        user.role === 'admin'
          ? '/admin'
          : user.role === 'tutor'
            ? '/dashboard/tutor/profile'
            : user.role === 'student' || user.role === 'parent'
              ? '/dashboard/student'
              : from;
      navigate(dest, { replace: true });
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
          <Label htmlFor="email">Email or phone</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="text" placeholder="you@email.com or +92…" className="pl-9" {...register('email')} />
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
