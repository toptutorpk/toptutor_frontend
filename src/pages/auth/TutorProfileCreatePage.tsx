import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Check,
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  Languages as LanguagesIcon,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  Video,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Logo } from '@/components/common/Logo';
import { useAuthStore } from '@/store/authStore';
import { authService, type Course } from '@/services/authService';
import { ApiError, getAccessToken } from '@/api/client';
import { toast } from '@/components/ui/sonner';
import { PRICE_BOUNDS } from '@/constants';
import { useProfileCatalogs } from '@/hooks/useCatalogs';
import {
  ChipGroup,
  CoursesEditor,
  CredentialEditor,
  Field,
  ModeToggles,
  SectionTitle,
} from '@/components/tutor/profileFields';
import { SubjectPicker } from '@/components/tutor/SubjectPicker';
import {
  EMPTY_ROW,
  GENDER_OPTIONS,
  MODE_OPTIONS,
  type CredentialRow,
} from '@/components/tutor/profileFieldOptions';
import type { City, SessionMode, TeachingLanguage } from '@/types';

const STEPS = ['Basics', 'Teaching', 'Credentials', 'Rates'];

interface ProfileForm {
  headline: string;
  bio: string;
  city: City | '';
  area: string;
  gender: 'male' | 'female' | '';
  languages: TeachingLanguage | '';
  experienceYears: string;
  avatarUrl: string;
  videoIntroUrl: string;
  coverUrl: string;
  subjects: string[];
  gradeLevels: string[];
  skills: string;
  modes: SessionMode[];
  education: CredentialRow[];
  certifications: CredentialRow[];
  courses: Course[];
  hourlyRate: string;
  monthlyRate: string;
}

export default function TutorProfileCreatePage() {
  const user = useAuthStore((s) => s.user);
  const onboarding = useAuthStore((s) => s.onboarding);
  const clearOnboarding = useAuthStore((s) => s.clearOnboarding);
  const login = useAuthStore((s) => s.login);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const catalog = useProfileCatalogs();

  // Profile creation is only reachable after OTP verification set up an onboarding draft.
  useEffect(() => {
    if (!onboarding) navigate('/signup/tutor', { replace: true });
  }, [onboarding, navigate]);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    headline: '',
    bio: '',
    city: user?.city ?? '',
    area: '',
    gender: '',
    languages: '',
    experienceYears: '',
    avatarUrl: '',
    videoIntroUrl: '',
    coverUrl: '',
    subjects: [],
    gradeLevels: [],
    skills: '',
    modes: [],
    education: [{ ...EMPTY_ROW }],
    certifications: [],
    courses: [],
    hourlyRate: '',
    monthlyRate: '',
  });

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleIn = (key: 'subjects' | 'gradeLevels' | 'modes', value: string) =>
    setForm((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  // ---- Per-step validation --------------------------------------------------
  const stepValid = (s: number): boolean => {
    if (s === 0)
      return (
        form.headline.trim().length >= 4 &&
        form.bio.trim().length >= 20 &&
        form.city !== '' &&
        form.area.trim().length >= 2 &&
        form.gender !== '' &&
        form.languages !== '' &&
        Number(form.experienceYears) >= 0 &&
        form.experienceYears !== ''
      );
    if (s === 1)
      return form.subjects.length >= 1 && form.gradeLevels.length >= 1 && form.modes.length >= 1;
    if (s === 2) return form.education.some((e) => e.title.trim() && e.org.trim());
    if (s === 3) {
      const rate = Number(form.hourlyRate);
      return rate >= PRICE_BOUNDS.min && rate <= PRICE_BOUNDS.max;
    }
    return true;
  };

  const next = () => {
    if (!stepValid(step)) {
      toast.error('Please complete this step', {
        description: 'Fill the required fields before continuing.',
      });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!stepValid(3)) {
      toast.error('Set a valid hourly rate', {
        description: `Between PKR ${PRICE_BOUNDS.min} and PKR ${PRICE_BOUNDS.max}.`,
      });
      return;
    }
    if (!onboarding) {
      navigate('/signup/tutor', { replace: true });
      return;
    }
    setSaving(true);
    try {
      const skills = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const education = form.education.filter((e) => e.title.trim() && e.org.trim());
      const certifications = form.certifications.filter((c) => c.title.trim() && c.org.trim());
      const emptyToUndef = (v: string) => (v.trim() ? v.trim() : undefined);
      const listToUndef = <T,>(v: T[]) => (v.length ? v : undefined);

      await authService.createTutorProfile({
        firstName: onboarding.firstName,
        lastName: onboarding.lastName,
        headline: emptyToUndef(form.headline),
        bio: emptyToUndef(form.bio),
        city: form.city || undefined,
        area: emptyToUndef(form.area),
        gender: form.gender || undefined,
        teachingLanguage: form.languages || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        photoUrl: emptyToUndef(form.avatarUrl),
        videoIntroUrl: emptyToUndef(form.videoIntroUrl),
        coverUrl: emptyToUndef(form.coverUrl),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        monthlyRate: form.monthlyRate ? Number(form.monthlyRate) : undefined,
        subjects: listToUndef(form.subjects),
        gradeLevels: listToUndef(form.gradeLevels),
        skills: listToUndef(skills),
        modes: listToUndef(form.modes),
        education: listToUndef(education),
        certifications: listToUndef(certifications),
        courses: listToUndef(form.courses.filter((c) => c.abbreviation.trim() && c.title.trim())),
      });
      if (onboarding.password) {
        // Local signup: log in with the credentials set at registration.
        await login({ email: onboarding.email, password: onboarding.password });
      } else {
        // Google signup: already authenticated — just refresh the session user.
        const me = await authService.getMe();
        setSession(me, getAccessToken() ?? '');
      }
      clearOnboarding();
      toast.success('Profile created!', {
        description: 'Next: complete your 6-step verification to go live.',
      });
      navigate('/welcome', { state: { role: 'tutor' } });
    } catch (e) {
      toast.error('Could not create profile', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo to="/" />
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Build your tutor profile
          </h1>
          <p className="mt-1 text-muted-foreground">
            This is what students see on search and your public profile. The more complete, the more
            bookings you’ll get.
          </p>
        </div>

        {/* Stepper */}
        <div className="my-6 flex items-center">
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

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          {/* Step 1 — Basics */}
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon={User} title="About you" />
              <Field
                label="Professional headline"
                hint="A short tagline shown under your name."
                required
                counter={`${form.headline.length}/100`}
              >
                <Input
                  value={form.headline}
                  onChange={(e) => set('headline', e.target.value)}
                  placeholder="O/A-Levels Math & Physics specialist"
                  maxLength={100}
                />
              </Field>
              <Field
                label="About me"
                hint="Tell students about your teaching style and experience."
                required
                counter={`${form.bio.length}/1500`}
              >
                <Textarea
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="I’ve helped 200+ students improve their grades through…"
                  className="min-h-[120px]"
                  maxLength={1500}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" icon={MapPin} required>
                  <Select value={form.city} onValueChange={(v) => set('city', v as City)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.cities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Area / Locality">
                  <Input
                    value={form.area}
                    onChange={(e) => set('area', e.target.value)}
                    placeholder="DHA Phase 5"
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={form.gender}
                    onValueChange={(v) => set('gender', v as 'male' | 'female')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Teaching language" icon={LanguagesIcon}>
                  <Select
                    value={form.languages}
                    onValueChange={(v) => set('languages', v as TeachingLanguage)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.languages.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Years of experience">
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={form.experienceYears}
                    onChange={(e) => set('experienceYears', e.target.value)}
                    placeholder="5"
                  />
                </Field>
                <Field label="Photo URL" hint="Optional — paste a link to your profile photo.">
                  <Input
                    value={form.avatarUrl}
                    onChange={(e) => set('avatarUrl', e.target.value)}
                    placeholder="https://…"
                  />
                </Field>
                <Field label="Cover image URL" hint="Optional — a banner shown at the top of your profile.">
                  <Input
                    value={form.coverUrl}
                    onChange={(e) => set('coverUrl', e.target.value)}
                    placeholder="https://…"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 2 — Teaching */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <SectionTitle icon={BookOpen} title="Subjects you teach" />
                {/* Narrow by category, then pick — a flat chip list is unreadable at this many
                    subjects, and this is the first form a new tutor ever sees. */}
                <SubjectPicker selected={form.subjects} onChange={(v) => set('subjects', v)} />
              </div>
              <div>
                <SectionTitle icon={BookOpen} title="Courses" hint="Add a course code + title; add as many as you like" />
                <CoursesEditor courses={form.courses} onChange={(c) => set('courses', c)} />
              </div>
              <div>
                <SectionTitle icon={GraduationCap} title="Grade levels" />
                <ChipGroup
                  options={catalog.gradeLevels}
                  selected={form.gradeLevels}
                  onToggle={(v) => toggleIn('gradeLevels', v)}
                />
              </div>
              <div>
                <SectionTitle icon={Video} title="How do you teach?" />
                <ModeToggles
                  selected={form.modes}
                  onToggle={(v) => toggleIn('modes', v)}
                  options={catalog.modes}
                />
              </div>
              <Field
                label="Skills & strengths"
                icon={Sparkles}
                hint="Comma-separated, e.g. Exam prep, Concept clarity, Past papers."
              >
                <Input
                  value={form.skills}
                  onChange={(e) => set('skills', e.target.value)}
                  placeholder="Exam prep, Concept clarity, Past papers"
                />
              </Field>
            </div>
          )}

          {/* Step 3 — Credentials */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <SectionTitle icon={GraduationCap} title="Education" />
                <CredentialEditor
                  rows={form.education}
                  onChange={(rows) => set('education', rows)}
                  titlePlaceholder="Degree (e.g. BSc Mathematics)"
                  orgPlaceholder="Institution"
                />
              </div>
              <div>
                <SectionTitle icon={Award} title="Certifications" hint="Optional" />
                <CredentialEditor
                  rows={form.certifications}
                  onChange={(rows) => set('certifications', rows)}
                  titlePlaceholder="Certification name"
                  orgPlaceholder="Issuer"
                />
              </div>
              <p className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
                You’ll upload supporting documents during the 6-step verification. These credentials
                show as “unverified” until our team confirms them.
              </p>
            </div>
          )}

          {/* Step 4 — Rates */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon={Wallet} title="Your rates" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Hourly rate (PKR)"
                  hint={`Between PKR ${PRICE_BOUNDS.min.toLocaleString()} and PKR ${PRICE_BOUNDS.max.toLocaleString()}.`}
                >
                  <Input
                    type="number"
                    min={PRICE_BOUNDS.min}
                    max={PRICE_BOUNDS.max}
                    step={PRICE_BOUNDS.step}
                    value={form.hourlyRate}
                    onChange={(e) => set('hourlyRate', e.target.value)}
                    placeholder="2000"
                  />
                </Field>
                <Field label="Expected Monthly package (PKR)" hint="Optional — your starting monthly rate for recurring students.">
                  <Input
                    type="number"
                    min={0}
                    value={form.monthlyRate}
                    onChange={(e) => set('monthlyRate', e.target.value)}
                    placeholder="20000"
                  />
                </Field>
              </div>

              <Summary form={form} />
            </div>
          )}

          {/* Nav */}
          <div className="mt-7 flex gap-3 border-t pt-5">
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="gradient"
                size="lg"
                className="ml-auto"
                onClick={next}
                disabled={!stepValid(step)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                className="ml-auto"
                onClick={submit}
                disabled={!stepValid(3) || saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Profile <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Summary({ form }: { form: ProfileForm }) {
  const items: { label: string; value: string }[] = [
    { label: 'Headline', value: form.headline || '—' },
    { label: 'Location', value: form.city ? `${form.area || '—'}, ${form.city}` : '—' },
    { label: 'Subjects', value: form.subjects.join(', ') || '—' },
    { label: 'Grade levels', value: form.gradeLevels.join(', ') || '—' },
    {
      label: 'Modes',
      value:
        form.modes.map((m) => MODE_OPTIONS.find((o) => o.value === m)?.label).join(', ') || '—',
    },
    { label: 'Experience', value: form.experienceYears ? `${form.experienceYears} years` : '—' },
  ];
  return (
    <div className="rounded-xl border bg-secondary/30 p-4">
      <h3 className="mb-3 font-display text-sm font-bold">Review your profile</h3>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{it.label}</dt>
            <dd className="text-sm font-medium">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
