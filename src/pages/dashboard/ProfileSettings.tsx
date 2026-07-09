import { useEffect, useState } from 'react';
import {
  Camera,
  Bell,
  Lock,
  Globe,
  Trash2,
  User,
  MapPin,
  Languages as LanguagesIcon,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  Video,
  Wallet,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChipGroup,
  CredentialEditor,
  Field,
  ModeToggles,
  SectionTitle,
} from '@/components/tutor/profileFields';
import {
  EMPTY_ROW,
  GENDER_OPTIONS,
  type CredentialRow,
} from '@/components/tutor/profileFieldOptions';
import { PRICE_BOUNDS } from '@/constants';
import { useProfileCatalogs } from '@/hooks/useCatalogs';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { ApiError, getAccessToken } from '@/api/client';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import type { City, SessionMode, TeachingLanguage } from '@/types';

export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === 'tutor';

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Manage your account, notifications and security." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {isTutor ? <TutorProfileForm /> : <BasicProfileForm />}
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            {[
              { icon: Bell, label: 'Session reminders', desc: 'SMS & push 24h and 1h before sessions', on: true },
              { icon: Globe, label: 'New tutor matches', desc: 'When a tutor matches your requirement', on: true },
              { icon: Bell, label: 'Promotions & tips', desc: 'Occasional product updates and offers', on: false },
            ].map((n, i) => (
              <div key={n.label}>
                {i > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <n.icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div>
                      <div className="font-medium">{n.label}</div>
                      <div className="text-sm text-muted-foreground">{n.desc}</div>
                    </div>
                  </div>
                  <Switch defaultChecked={n.on} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="flex items-center gap-2 font-display font-bold">
                <Lock className="h-4 w-4" /> Change password
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div />
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="gradient" className="mt-4" onClick={() => toast.success('Password updated')}>
                Update password
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border bg-card p-6 shadow-soft">
              <div>
                <h3 className="font-display font-bold">Two-factor authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
              <div>
                <h3 className="font-display font-bold text-red-700 dark:text-red-400">Delete account</h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/70">
                  Permanently delete your account and all data.
                </p>
              </div>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile header (shared)                                                   */
/* -------------------------------------------------------------------------- */
function ProfileHeader() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatarUrl} alt={user?.name} />
          <AvatarFallback className="text-xl">{getInitials(user?.name ?? 'TT')}</AvatarFallback>
        </Avatar>
        <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
          <Camera className="h-4 w-4" />
        </button>
      </div>
      <div>
        <h3 className="font-display text-lg font-bold">{user?.name ?? 'Your Name'}</h3>
        <p className="text-sm capitalize text-muted-foreground">{user?.role ?? 'student'} account</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Student / parent — basic profile                                          */
/* -------------------------------------------------------------------------- */
function BasicProfileForm() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <ProfileHeader />
      <Separator className="my-6" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input defaultValue={user?.name} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input defaultValue={user?.phone} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input defaultValue={user?.email} placeholder="you@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input defaultValue={user?.city ?? 'Karachi'} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Bio</Label>
          <Textarea placeholder="Tell us a bit about yourself…" />
        </div>
      </div>
      <Button variant="gradient" className="mt-6" onClick={() => toast.success('Profile saved')}>
        Save changes
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tutor — full editable profile (mirrors the onboarding wizard)             */
/* -------------------------------------------------------------------------- */
interface TutorProfileState {
  name: string;
  phone: string;
  email: string;
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
  hourlyRate: string;
  monthlyRate: string;
}

function TutorProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const catalog = useProfileCatalogs();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TutorProfileState>({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
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
    hourlyRate: '',
    monthlyRate: '',
  });

  // Pre-fill from the saved profile so editing starts from the current values.
  useEffect(() => {
    let cancelled = false;
    authService
      .getMyTutorProfile()
      .then((p) => {
        if (cancelled || !p) return;
        setForm((f) => ({
          ...f,
          name: [p.firstName, p.lastName].filter(Boolean).join(' ') || f.name,
          headline: p.headline ?? '',
          bio: p.bio ?? '',
          city: (p.city as City) ?? '',
          area: p.area ?? '',
          gender: (p.gender as 'male' | 'female') ?? '',
          languages: (p.teachingLanguage as TeachingLanguage) ?? '',
          experienceYears: p.experienceYears != null ? String(p.experienceYears) : '',
          avatarUrl: p.photoUrl ?? '',
          videoIntroUrl: p.videoIntroUrl ?? '',
          coverUrl: p.coverUrl ?? '',
          subjects: p.subjects ?? [],
          gradeLevels: p.gradeLevels ?? [],
          skills: (p.skills ?? []).join(', '),
          modes: (p.modes as SessionMode[]) ?? [],
          education: p.education?.length ? p.education : [{ ...EMPTY_ROW }],
          certifications: p.certifications ?? [],
          hourlyRate: p.hourlyRate != null ? String(p.hourlyRate) : '',
          monthlyRate: p.monthlyRate != null ? String(p.monthlyRate) : '',
        }));
      })
      .catch(() => {
        /* leave defaults; a fresh profile may not exist yet */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof TutorProfileState>(key: K, value: TutorProfileState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleIn = (key: 'subjects' | 'gradeLevels' | 'modes', value: string) =>
    setForm((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  const save = async () => {
    if (form.headline.trim().length < 4 || form.bio.trim().length < 20) {
      toast.error('Add a headline and a short bio', {
        description: 'These appear on your public profile and search results.',
      });
      return;
    }
    // Split the single "Full name" field back into first/last (last falls back to first).
    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0] || 'Tutor';
    const lastName = parts.slice(1).join(' ') || firstName;
    const emptyToUndef = (v: string) => (v.trim() ? v.trim() : undefined);
    const listToUndef = <T,>(v: T[]) => (v.length ? v : undefined);

    setSaving(true);
    try {
      const updated = await authService.updateTutorProfile({
        firstName,
        lastName,
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
        skills: listToUndef(
          form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        ),
        modes: listToUndef(form.modes),
        education: listToUndef(form.education.filter((e) => e.title.trim() && e.org.trim())),
        certifications: listToUndef(
          form.certifications.filter((c) => c.title.trim() && c.org.trim()),
        ),
      });
      // Reflect any name/city change in the session immediately.
      setSession(updated, getAccessToken() ?? '');
      toast.success('Profile saved', { description: 'Your changes are now live on your profile.' });
    } catch (e) {
      toast.error('Could not save profile', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account & basics */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <ProfileHeader />
        <Separator className="my-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon={User}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="you@email.com"
            />
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
          <Field label="City" icon={MapPin}>
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
            <Select value={form.gender} onValueChange={(v) => set('gender', v as 'male' | 'female')}>
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
          <Field label="Photo URL" icon={Camera} hint="Link to your profile photo.">
            <Input
              value={form.avatarUrl}
              onChange={(e) => set('avatarUrl', e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Video intro URL" icon={Video} hint="A 2-minute intro boosts bookings.">
            <Input
              value={form.videoIntroUrl}
              onChange={(e) => set('videoIntroUrl', e.target.value)}
              placeholder="https://youtu.be/…"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Cover image URL" hint="Banner shown at the top of your public profile.">
              <Input
                value={form.coverUrl}
                onChange={(e) => set('coverUrl', e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Professional headline" hint="A short tagline shown under your name.">
              <Input
                value={form.headline}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="O/A-Levels Math & Physics specialist"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="About me">
              <Textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell students about your teaching style and experience…"
                className="min-h-[120px]"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* What you teach */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <SectionTitle icon={BookOpen} title="Subjects you teach" />
        <ChipGroup
          options={catalog.subjects}
          selected={form.subjects}
          onToggle={(v) => toggleIn('subjects', v)}
        />
        <Separator className="my-5" />
        <SectionTitle icon={GraduationCap} title="Grade levels" />
        <ChipGroup
          options={catalog.gradeLevels}
          selected={form.gradeLevels}
          onToggle={(v) => toggleIn('gradeLevels', v)}
        />
        <Separator className="my-5" />
        <SectionTitle icon={Video} title="How do you teach?" />
        <ModeToggles selected={form.modes} onToggle={(v) => toggleIn('modes', v)} options={catalog.modes} />
        <Separator className="my-5" />
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

      {/* Credentials */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <SectionTitle icon={GraduationCap} title="Education" />
        <CredentialEditor
          rows={form.education}
          onChange={(rows) => set('education', rows)}
          titlePlaceholder="Degree (e.g. BSc Mathematics)"
          orgPlaceholder="Institution"
        />
        <Separator className="my-5" />
        <SectionTitle icon={Award} title="Certifications" hint="Optional" />
        <CredentialEditor
          rows={form.certifications}
          onChange={(rows) => set('certifications', rows)}
          titlePlaceholder="Certification name"
          orgPlaceholder="Issuer"
        />
      </div>

      {/* Rates */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
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
          <Field label="Monthly package (PKR)" hint="Optional — for recurring students.">
            <Input
              type="number"
              min={0}
              value={form.monthlyRate}
              onChange={(e) => set('monthlyRate', e.target.value)}
              placeholder="20000"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
