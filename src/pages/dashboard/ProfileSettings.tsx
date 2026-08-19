import { useEffect, useState } from 'react';
import {
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChipGroup,
  CoursesEditor,
  CredentialEditor,
  Field,
  ModeToggles,
  SectionTitle,
} from '@/components/tutor/profileFields';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import {
  EMPTY_ROW,
  GENDER_OPTIONS,
  type CredentialRow,
} from '@/components/tutor/profileFieldOptions';
import { GRADE_LEVELS, PRICE_BOUNDS } from '@/constants';
import { useProfileCatalogs } from '@/hooks/useCatalogs';
import { useAuthStore } from '@/store/authStore';
import { authService, type Child, type Course } from '@/services/authService';
import { type ContactChannel } from '@/services/accountService';
import { ApiError, getAccessToken } from '@/api/client';
import { cn, getInitials } from '@/lib/utils';
import { SubjectPicker } from '@/components/tutor/SubjectPicker';
import { VerifiedContactField } from '@/components/account/VerifiedContactField';
import { ContactChangeDialog } from '@/components/account/ContactChangeDialog';
import { toast } from '@/components/ui/sonner';
import type { City, SessionMode, TeachingLanguage } from '@/types';

export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const isTutor = user?.role === 'tutor';

  return (
    <div>
      <PageHeader title="Profile" description="Manage the details shown on your public profile." />
      {isTutor ? (
        <TutorProfileForm />
      ) : (
        <div className="space-y-6">
          <BasicProfileForm />
          {user?.role === 'parent' && <ParentChildren />}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Profile header (shared)                                                   */
/* -------------------------------------------------------------------------- */
function ProfileHeader({ url, onChange }: { url?: string; onChange?: (url: string) => void }) {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex items-center gap-4">
      <AvatarUpload url={url} name={user?.name} size={80} onChange={onChange} />
      <div>
        <h3 className="font-display text-lg font-bold">{user?.name ?? 'Your Name'}</h3>
        <p className="text-sm capitalize text-muted-foreground">{user?.role ?? 'student'} account</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Click the camera to change your profile photo.</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Student / parent — basic profile                                          */
/* -------------------------------------------------------------------------- */
function BasicProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const [changingChannel, setChangingChannel] = useState<ContactChannel | null>(null);

  // The store is the only copy of these on screen, so it has to be told about the change or the
  // field keeps showing the old value until the next reload.
  const applyChange = (details: { phone: string; email?: string }) => {
    if (!user) return;
    setSession({ ...user, phone: details.phone, email: details.email }, getAccessToken() ?? '');
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <ProfileHeader />
      <Separator className="my-6" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input defaultValue={user?.name} />
        </div>
        <VerifiedContactField channel="PHONE" value={user?.phone} onEdit={setChangingChannel} />
        <VerifiedContactField channel="EMAIL" value={user?.email} onEdit={setChangingChannel} />
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

      <ContactChangeDialog
        channel={changingChannel}
        currentValue={changingChannel === 'PHONE' ? user?.phone : user?.email}
        onClose={() => setChangingChannel(null)}
        onChanged={applyChange}
      />
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
  courses: Course[];
  hourlyRate: string;
  monthlyRate: string;
}

function TutorProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const catalog = useProfileCatalogs();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [changingChannel, setChangingChannel] = useState<ContactChannel | null>(null);
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
    courses: [],
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
          name: [p.firstName, p.lastName].filter(Boolean).join(' '),
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
          courses: p.courses ?? [],
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
    // Validate; collect per-field messages so the offending cells can be highlighted.
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (form.headline.trim().length < 4) next.headline = 'Add a headline of at least 4 characters.';
    if (form.bio.trim().length < 20)
      next.bio = 'Tell students a bit more — at least 20 characters.';
    if (!form.city) next.city = 'Select your city.';
    if (form.hourlyRate) {
      const rate = Number(form.hourlyRate);
      if (!Number.isFinite(rate) || rate < PRICE_BOUNDS.min || rate > PRICE_BOUNDS.max)
        next.hourlyRate = `Enter a rate between PKR ${PRICE_BOUNDS.min} and PKR ${PRICE_BOUNDS.max}.`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the highlighted fields');
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
        courses: listToUndef(form.courses.filter((c) => c.abbreviation.trim() && c.title.trim())),
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
        <ProfileHeader url={form.avatarUrl || undefined} onChange={(u) => set('avatarUrl', u)} />
        <Separator className="my-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon={User} error={errors.name} required>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              aria-invalid={!!errors.name}
            />
          </Field>
          {/* Both were editable boxes that updateTutorProfile never submitted, so anything typed
              was silently discarded. They are verified facts, changed through the code flow rather
              than by typing — the pencil opens the only thing that can actually change them. */}
          <VerifiedContactField channel="PHONE" value={form.phone} onEdit={setChangingChannel} />
          <VerifiedContactField channel="EMAIL" value={form.email} onEdit={setChangingChannel} />
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
          <Field label="City" icon={MapPin} error={errors.city} required>
            <Select value={form.city} onValueChange={(v) => set('city', v as City)}>
              <SelectTrigger aria-invalid={!!errors.city} className={cn(errors.city && 'border-red-500 ring-1 ring-red-500')}>
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
          <div className="sm:col-span-2">
            <Field
              label="Professional headline"
              hint="A short tagline shown under your name."
              error={errors.headline}
              required
              counter={`${form.headline.length}/100`}
            >
              <Input
                value={form.headline}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="O/A-Levels Math & Physics specialist"
                maxLength={100}
                aria-invalid={!!errors.headline}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="About me" error={errors.bio} required counter={`${form.bio.length}/1500`}>
              <Textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Tell students about your teaching style and experience…"
                className="min-h-[120px]"
                maxLength={1500}
                aria-invalid={!!errors.bio}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* What you teach */}
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <SectionTitle icon={BookOpen} title="Subjects you teach" />
        {/* Narrow by category, then pick — a flat chip list is unreadable at this many subjects. */}
        <SubjectPicker selected={form.subjects} onChange={(v) => set('subjects', v)} />
        <Separator className="my-5" />
        <SectionTitle icon={BookOpen} title="Courses" hint="Add a course code + title; add as many as you like" />
        <CoursesEditor courses={form.courses} onChange={(c) => set('courses', c)} />
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
            error={errors.hourlyRate}
          >
            <Input
              type="number"
              min={PRICE_BOUNDS.min}
              max={PRICE_BOUNDS.max}
              step={PRICE_BOUNDS.step}
              value={form.hourlyRate}
              onChange={(e) => set('hourlyRate', e.target.value)}
              placeholder="2000"
              aria-invalid={!!errors.hourlyRate}
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
      </div>

      <div className="flex justify-end">
        <Button variant="gradient" size="lg" onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>

      {/* Writes straight back into the form so the field shows the new value at once; the tutor
          profile is loaded once and would otherwise keep displaying the old one until a reload. */}
      <ContactChangeDialog
        channel={changingChannel}
        currentValue={changingChannel === 'PHONE' ? form.phone : form.email}
        onClose={() => setChangingChannel(null)}
        onChanged={(details) =>
          setForm((f) => ({ ...f, phone: details.phone, email: details.email ?? f.email }))
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Parent — manage children                                                  */
/* -------------------------------------------------------------------------- */
function ParentChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', gradeLevel: '', school: '', notes: '' });

  useEffect(() => {
    let cancelled = false;
    authService
      .listChildren()
      .then((c) => !cancelled && setChildren(c))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const add = async () => {
    if (form.name.trim().length < 2) {
      toast.error('Enter the child’s name');
      return;
    }
    setAdding(true);
    try {
      const child = await authService.addChild({
        name: form.name.trim(),
        gradeLevel: form.gradeLevel || undefined,
        school: form.school || undefined,
        notes: form.notes || undefined,
      });
      setChildren((c) => [...c, child]);
      setForm({ name: '', gradeLevel: '', school: '', notes: '' });
      toast.success('Child added');
    } catch (e) {
      toast.error('Could not add child', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await authService.removeChild(id);
      setChildren((c) => c.filter((x) => x.id !== id));
    } catch {
      toast.error('Could not remove child');
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <SectionTitle icon={User} title="My children" hint="Whom you book tutoring for" />

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : children.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">No children added yet — add one below.</p>
      ) : (
        <ul className="mb-5 divide-y rounded-xl border">
          {children.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[c.gradeLevel, c.school].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Child’s name">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ali Shah" />
        </Field>
        <Field label="Grade / class">
          <Select value={form.gradeLevel} onValueChange={(v) => setForm((f) => ({ ...f, gradeLevel: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="School (optional)">
          <Input value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} placeholder="Beaconhouse" />
        </Field>
        <Field label="Notes (optional)" hint="e.g. subjects they need help with">
          <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Needs Maths & Physics" />
        </Field>
      </div>
      <Button variant="outline" className="mt-4" onClick={add} disabled={adding}>
        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />} Add child
      </Button>
    </div>
  );
}
