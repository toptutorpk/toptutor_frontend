import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messagingService } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

/**
 * Books the free 15-minute intro call with a tutor — the gate that unlocks in-app messaging — then
 * drops the learner into the chat. Guests are sent to log in; tutor/admin accounts are nudged to use
 * a learner account. Shared by the tutor profile "Send a message" button and the booking panel.
 */
export function useBookIntro() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const book = async (tutorId: number, opts?: { tutorName?: string; slug?: string }) => {
    if (!user) {
      navigate('/login', { state: opts?.slug ? { from: `/tutors/${opts.slug}` } : undefined });
      return;
    }
    if (user.role !== 'student' && user.role !== 'parent') {
      toast.info('Use a student or parent account to message tutors.');
      return;
    }
    if (!Number.isFinite(tutorId)) {
      toast.error('This tutor can’t be messaged yet.');
      return;
    }
    setLoading(true);
    try {
      await messagingService.bookIntro(tutorId);
      toast.success('Chat opened', {
        description: `You can now message ${opts?.tutorName?.split(' ')[0] ?? 'this tutor'} in-app.`,
      });
      navigate('/dashboard/student/messages');
    } catch {
      toast.error('Could not start the chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { book, loading };
}
