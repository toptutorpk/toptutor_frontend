import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messagingService } from '@/services/messagingService';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';

interface ContactOpts {
  tutorName?: string;
  slug?: string;
}

/**
 * Shared plumbing for the two ways a learner reaches a tutor: opening a chat, and requesting the
 * free intro call. Guests are sent to log in, tutor/admin accounts are nudged to use a learner
 * account, and on success the learner lands in the chat.
 */
function useContactTutor(
  call: (tutorId: number) => Promise<unknown>,
  success: (firstName: string) => { title: string; description: string },
) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const run = async (tutorId: number, opts?: ContactOpts) => {
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
      await call(tutorId);
      const { title, description } = success(opts?.tutorName?.split(' ')[0] ?? 'this tutor');
      toast.success(title, { description });
      navigate('/dashboard/student/messages');
    } catch {
      toast.error('Could not start the chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { run, loading };
}

/**
 * Opens a chat with a tutor and drops the learner into it.
 *
 * <p>Books nothing. Wanting to ask a tutor a question is not a request for their free intro call,
 * so this works for every tutor — including those who offer no demo slot.
 */
export function useStartChat() {
  const { run, loading } = useContactTutor(
    (tutorId) => messagingService.startConversation(tutorId),
    (name) => ({ title: 'Chat opened', description: `You can now message ${name} in-app.` }),
  );
  return { start: run, loading };
}

/**
 * Requests the tutor's free 15-minute intro call, which also opens the chat.
 *
 * <p>Only surfaced for tutors who have published a demo slot (`demoAvailable`), so this never
 * files a request against a tutor who does not offer one.
 */
export function useBookIntro() {
  const { run, loading } = useContactTutor(
    (tutorId) => messagingService.bookIntro(tutorId),
    (name) => ({
      title: 'Intro call requested',
      description: `${name} will confirm a time — you can message them in the meantime.`,
    }),
  );
  return { book: run, loading };
}
