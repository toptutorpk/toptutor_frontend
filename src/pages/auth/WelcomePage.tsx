import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper, Search, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  const role = (useLocation().state as { role?: string })?.role ?? 'student';
  const isTutor = role === 'tutor';

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"
      >
        <PartyPopper className="h-12 w-12" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-7 font-display text-3xl font-extrabold tracking-tight"
      >
        You’re all set! 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mx-auto mt-3 max-w-sm text-muted-foreground"
      >
        {isTutor
          ? 'Your tutor account is ready. Complete your 6-step verification to start receiving bookings.'
          : 'Your account is ready. Let’s find the perfect verified tutor for you.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8 flex flex-col gap-3"
      >
        {isTutor ? (
          <>
            <Button variant="gradient" size="lg" asChild>
              <Link to="/dashboard/tutor/verification">
                <ShieldCheck className="h-4 w-4" /> Start Verification
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard/tutor">
                <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="gradient" size="lg" asChild>
              <Link to="/tutors">
                <Search className="h-4 w-4" /> Find a Tutor
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard/student">
                <LayoutDashboard className="h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
