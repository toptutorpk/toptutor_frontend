import { useNavigate } from 'react-router-dom';
import { dashboardHome } from '@/constants/navigation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';

export function SocialButtons({ divider = true }: { divider?: boolean }) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const navigate = useNavigate();

  const handleGoogle = async (idToken: string) => {
    try {
      const result = await loginWithGoogle(idToken);
      toast.success('Signed in with Google');
      // ACTIVE accounts go to the dashboard; new/unfinished ones finish their profile first.
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Unable to load your account. Please try again.');
      navigate(
        user.role === 'tutor' && result.status !== 'ACTIVE'
          ? '/signup/tutor/profile'
          : dashboardHome(user.role),
        { replace: true },
      );
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
            toast.error('Couldn’t load Google sign-in', {
              description: 'Check your connection and retry.',
            })
          }
        />
      </div>
      {divider && (
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or use your email</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
    </>
  );
}
