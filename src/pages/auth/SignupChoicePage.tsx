import { Link } from 'react-router-dom';
import { GraduationCap, Users, Building2, ArrowRight } from 'lucide-react';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { cn } from '@/lib/utils';

const CHOICES = [
  {
    to: '/signup/student',
    icon: Users,
    title: 'I’m a Parent / Student',
    desc: 'Find verified tutors, book safely, and track your child’s progress.',
    color: 'from-brand-500 to-brand-700',
  },
  {
    to: '/signup/tutor',
    icon: GraduationCap,
    title: 'I’m a Tutor',
    desc: 'Get verified, build a trusted profile, and earn with guaranteed payouts.',
    color: 'from-violet-500 to-purple-700',
  },
  {
    to: '/institutes',
    icon: Building2,
    title: 'I’m an Institute',
    desc: 'Hire verified teachers at scale with contracts and retainer tools.',
    color: 'from-amber-500 to-orange-600',
  },
];

export default function SignupChoicePage() {
  return (
    <div>
      <AuthHeader
        title="Join TopTutor"
        subtitle="Choose how you’d like to get started. You can always switch later."
      />
      <div className="space-y-3">
        {CHOICES.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <span
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                c.color,
              )}
            >
              <c.icon className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-bold">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
