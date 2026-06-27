import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

export default function EmailVerificationPage() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
      >
        <MailCheck className="h-10 w-10" />
      </motion.div>
      <h1 className="mt-6 font-display text-2xl font-extrabold">Verify your email</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
        We’ve sent a verification link to your inbox. Click the link to activate your TopTutor
        account.
      </p>
      <Button
        variant="gradient"
        size="lg"
        className="mt-8 w-full"
        onClick={() => toast.success('Verification email resent')}
      >
        Resend email
      </Button>
      <Button variant="ghost" className="mt-4" asChild>
        <Link to="/login">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </Button>
    </div>
  );
}
