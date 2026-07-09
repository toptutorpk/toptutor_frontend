import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';

export function SocialButtons() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const navigate = useNavigate();

  const handleGoogle = async (idToken: string) => {
    try {
      const result = await loginWithGoogle(idToken);
      toast.success('Signed in with Google');
      // ACTIVE accounts go to the dashboard; new/unfinished ones finish their profile first.
      navigate(result.status === 'ACTIVE' ? '/dashboard/tutor' : '/signup/tutor/profile');
    } catch (e) {
      toast.error('Google sign-in failed', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    }
  };

  return (
    <>
      <div className="space-y-3">
        <GoogleSignInButton
          onCredential={handleGoogle}
          onError={() =>
            toast.error('Couldn’t load Google sign-in', { description: 'Check your connection and retry.' })
          }
        />
        <Button variant="outline" size="lg" type="button" className="w-full" disabled title="Coming soon">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6 4.39 10.97 10.13 11.85v-8.38H7.08v-3.47h3.05V9.4c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.47h-2.79v8.38C19.61 23.04 24 18.07 24 12.07Z" />
          </svg>
          Facebook
        </Button>
      </div>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
