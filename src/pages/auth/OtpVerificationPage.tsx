import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { OtpInput } from '@/components/auth/OtpInput';
import { authService } from '@/services/authService';
import { toMaskedDisplay } from '@/lib/phone';
import { useCooldown } from '@/hooks/useCooldown';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

export default function OtpVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  // Held canonically, because it is what the verify and resend calls are keyed by; only the
  // rendering below converts to the local form.
  const phone = (location.state as { phone?: string })?.phone ?? '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  // Was a hand-rolled 45-second countdown that decremented once per tick, so it fell behind real
  // time whenever the tab was hidden. Same hook and same minute as the tutor signup flow now.
  const { remaining, active, start } = useCooldown();

  const verify = async (value: string) => {
    setLoading(true);
    try {
      const { user, token } = await authService.verifyOtp(phone, value);
      setSession(user, token);
      toast.success('Verified!');
      navigate('/welcome');
    } catch {
      toast.error('Invalid code', { description: 'Please enter the 6-digit code we sent.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
        <MessageSquare className="h-8 w-8" />
      </div>
      <AuthHeader
        title="Verify your phone"
        subtitle={
          <>
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-foreground">
              {toMaskedDisplay(phone) || 'your phone'}
            </span>
          </>
        }
      />
      <OtpInput resetToken={resetToken} onComplete={verify} onChange={setCode} />

      <Button
        variant="gradient"
        size="lg"
        className="mt-8 w-full"
        disabled={code.length !== 6 || loading}
        onClick={() => verify(code)}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify & Continue
      </Button>

      <div className="mt-5 text-sm text-muted-foreground">
        Didn’t get the code?{' '}
        {active ? (
          <span className="font-medium tabular-nums">
            Resend in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        ) : (
          <button
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              authService.requestOtp(phone);
              start();
              // The previous code is dead once a new one is sent; clearing the boxes stops the
              // person submitting digits that can only be rejected.
              setResetToken((n) => n + 1);
              toast.success('Code resent', { description: 'Your previous code is no longer valid.' });
            }}
          >
            Resend code
          </button>
        )}
      </div>

      <Button variant="ghost" className="mt-6" asChild>
        <Link to="/login">
          <ArrowLeft className="h-4 w-4" /> Use a different method
        </Link>
      </Button>
    </div>
  );
}
