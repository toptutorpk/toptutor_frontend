import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authService.forgotPassword(email);
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Check your inbox</h1>
        <p className="mt-2 text-muted-foreground">
          We’ve sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
        </p>
        <Button variant="outline" className="mt-8" asChild>
          <Link to="/login">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title="Forgot password?" subtitle="Enter your email and we’ll send you a reset link." />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
      <Button variant="ghost" className="mt-6 w-full" asChild>
        <Link to="/login">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </Button>
    </div>
  );
}
