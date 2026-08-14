import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { authService } from '@/services/authService';
import { ApiError } from '@/api/client';
import { isStrongPassword, passwordChecklist } from '@/lib/password';
import { toast } from '@/components/ui/sonner';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const allValid = isStrongPassword(password) && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password updated!', {
        description: 'You can now log in with your new password.',
      });
      navigate('/login');
    } catch (err) {
      toast.error('Could not reset password', {
        description:
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'This reset link may be invalid or expired. Request a new one.',
      });
    } finally {
      setLoading(false);
    }
  };

  // No token in the URL → the link is malformed or was opened directly.
  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Invalid reset link</h1>
        <p className="mt-2 text-muted-foreground">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Button variant="gradient" className="mt-8" asChild>
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title="Set a new password" subtitle="Choose a strong password you’ll remember." />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-9"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Toggle password"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="pl-9"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {confirm.length > 0 && password !== confirm && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
        </div>

        {/* Withdraws once every rule is met, as on the signup form: a list of instructions that
            have all been followed only stands between the field and the button. */}
        {!isStrongPassword(password) && (
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {passwordChecklist(password).map((rule) => (
              <li
                key={rule.label}
                className={cn(
                  'flex items-center gap-2 text-xs',
                  rule.met ? 'text-emerald-600' : 'text-muted-foreground',
                )}
              >
                <CheckCircle2 className={cn('h-3.5 w-3.5', !rule.met && 'opacity-40')} /> {rule.label}
              </li>
            ))}
          </ul>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={!allValid || loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
