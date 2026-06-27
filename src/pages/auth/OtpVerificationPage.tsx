import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { OtpInput } from '@/components/auth/OtpInput';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

export default function OtpVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const phone = (location.state as { phone?: string })?.phone ?? '+92 300 1234567';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

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
            <span className="font-medium text-foreground">{phone}</span>
          </>
        }
      />
      <OtpInput onComplete={verify} onChange={setCode} />

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
        {seconds > 0 ? (
          <span>Resend in {seconds}s</span>
        ) : (
          <button
            className="font-semibold text-primary hover:underline"
            onClick={() => {
              setSeconds(45);
              authService.requestOtp(phone);
              toast.success('Code resent');
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
