import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { cn, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { toast } from '@/components/ui/sonner';

const RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
];

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const allValid = RULES.every((r) => r.test(password)) && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await sleep(800);
    setLoading(false);
    toast.success('Password updated!', { description: 'You can now log in with your new password.' });
    navigate('/login');
  };

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
            />
          </div>
        </div>

        <ul className="space-y-1.5">
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li key={r.label} className={cn('flex items-center gap-2 text-xs', ok ? 'text-emerald-600' : 'text-muted-foreground')}>
                <CheckCircle2 className={cn('h-3.5 w-3.5', !ok && 'opacity-40')} /> {r.label}
              </li>
            );
          })}
        </ul>

        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={!allValid || loading}>
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
