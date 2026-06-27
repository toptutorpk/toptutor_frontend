import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Check, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { useAuthStore } from '@/store/authStore';
import { CITIES, POPULAR_SUBJECTS } from '@/constants';
import { toast } from '@/components/ui/sonner';

const STEPS = ['Account', 'Expertise', 'Get Verified'];

export default function TutorSignupPage() {
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', city: '', bio: '', rate: '' });
  const [submitting, setSubmitting] = useState(false);
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  const toggleSubject = (s: string) =>
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSubmitting(true);
    await signup({ name: form.name, phone: form.phone, role: 'tutor', city: form.city });
    setSubmitting(false);
    toast.success('Welcome aboard!', { description: 'Let’s get you verified.' });
    navigate('/welcome', { state: { role: 'tutor' } });
  };

  return (
    <div>
      <AuthHeader title="Become a verified tutor" subtitle="Build a trusted profile in 3 quick steps." />

      {/* Stepper */}
      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  i < step && 'border-brand-500 bg-brand-500 text-white',
                  i === step && 'border-brand-500 text-brand-600',
                  i > step && 'border-input text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1.5 text-xs font-medium">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-0.5 flex-1', i < step ? 'bg-brand-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ayesha Khan" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone number</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 1234567" />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="gradient" size="lg" className="w-full" onClick={next} disabled={!form.name || !form.phone || !form.city}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>What do you teach? (pick all that apply)</Label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    subjects.includes(s)
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'hover:bg-secondary',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Hourly rate (PKR)</Label>
            <Input
              type="number"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              placeholder="2500"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Short bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell parents about your teaching style and experience…"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={back}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="gradient" size="lg" className="flex-1" onClick={next} disabled={subjects.length === 0}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-secondary/40 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="font-display font-bold">Next: 7-step verification</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              To earn your Verified Badge and start receiving bookings, you’ll complete:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['CNIC', 'Degree', 'Background Check', 'Experience', 'Proficiency Test', 'Video Demo'].map(
                (t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ),
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={back}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="gradient" size="lg" className="flex-1" onClick={finish} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Tutor Account
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
