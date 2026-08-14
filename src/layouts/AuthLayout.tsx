import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Star, Lock, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const TRUST_POINTS = [
  { icon: ShieldCheck, text: '7-step verified tutors only' },
  { icon: Lock, text: 'Secure escrow payments' },
  { icon: Star, text: '4.8 average rating, 40k+ reviews' },
  { icon: CheckCircle2, text: 'Free 15-minute intro calls' },
];

export function AuthLayout() {
  return (
    <div className="grid h-screen lg:grid-cols-2">
      {/* Left brand / illustration panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex lg:flex-col">
        <div className="bg-grid absolute inset-0 opacity-[0.07]" />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          {/* Knockout mark — the colour artwork is brand blue on brand blue here. */}
          <Logo to="/" tone="white" />
          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-[clamp(1.75rem,3vw+1rem,2.25rem)] font-extrabold leading-tight"
            >
              The tutor your child deserves — verified, every time.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-3 text-base text-white/80"
            >
              Join 25,000+ parents and 5,000+ verified tutors across Pakistan.
            </motion.p>

            <div className="mt-6 space-y-3">
              {TRUST_POINTS.map((p, i) => (
                <motion.div
                  key={p.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-white/90">{p.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs text-white/60">
            © {new Date().getFullYear()} TopTutor · Pakistan’s verified tutoring marketplace
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex h-screen flex-col">
        <div className="flex shrink-0 items-center justify-between p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-3">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        <p className="shrink-0 px-6 pb-3 text-center text-xs text-muted-foreground">
          Need help?{' '}
          <Link to="/contact" className="font-medium text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
