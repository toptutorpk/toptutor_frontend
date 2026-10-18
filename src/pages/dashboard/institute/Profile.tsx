import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Lock } from 'lucide-react';
import {
  instituteService,
  type InstituteEntityType,
  type SaveInstituteProfile,
} from '@/services/instituteService';
import { useCatalogs } from '@/hooks/useCatalogs';
import { ApiError, getAccessToken } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState, ErrorState } from '@/components/common/StateViews';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { VerifiedContactField } from '@/components/account/VerifiedContactField';
import { ContactChangeDialog } from '@/components/account/ContactChangeDialog';
import { type ContactChannel } from '@/services/accountService';
import { useAuthStore } from '@/store/authStore';
import { isValidCnic, CNIC_ERROR } from '@/lib/cnic';
import { toast } from '@/components/ui/sonner';

const ENTITY_TYPES: { value: InstituteEntityType; label: string }[] = [
  { value: 'COMPANY', label: 'Private limited company (SECP)' },
  { value: 'PARTNERSHIP', label: 'Partnership firm' },
  { value: 'SOCIETY', label: 'Registered society' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOLE_PROPRIETOR', label: 'Sole proprietorship' },
];

interface FormState {
  legalName: string;
  displayName: string;
  entityType: string;
  registrationNo: string;
  regulator: string;
  about: string;
  website: string;
  contactPerson: string;
  contactDesignation: string;
  contactCnic: string;
  cityId: string;
  area: string;
  address: string;
  campusName: string;
  studentCount: string;
}

const EMPTY: FormState = {
  legalName: '',
  displayName: '',
  entityType: '',
  registrationNo: '',
  regulator: '',
  about: '',
  website: '',
  contactPerson: '',
  contactDesignation: '',
  contactCnic: '',
  cityId: '',
  area: '',
  address: '',
  campusName: '',
  studentCount: '',
};

/**
 * Field rules, stated once and applied both while typing and on submit.
 *
 * <p>Every rule here mirrors the server's annotation on {@code SaveInstituteProfileRequest}
 * exactly — same lengths, same character sets, same bounds. A client rule that is looser lets the
 * person reach a server rejection they were given no warning about; one that is stricter refuses
 * input the server would have accepted. Either way the two disagreeing is the bug, so they are
 * written to match line for line.
 *
 * <p>Each returns an error string, or undefined when the value is acceptable. Empty is acceptable
 * everywhere: the profile is saved half-finished all the time, and completeness is enforced when
 * the institute submits for review, not on every keystroke.
 */
const RULES: Partial<Record<keyof FormState, (v: string) => string | undefined>> = {
  legalName: (v) => max(v, 200, 'Legal name'),
  displayName: (v) => max(v, 200, 'Display name'),
  registrationNo: (v) =>
    max(v, 80, 'Registration number') ??
    (v && !/^[A-Za-z0-9\-/ ]*$/.test(v)
      ? 'Use letters, digits, spaces, hyphens and slashes only'
      : undefined),
  regulator: (v) => max(v, 150, 'Regulator'),
  about: (v) => max(v, 2000, 'Description'),
  website: (v) =>
    max(v, 300, 'Website') ??
    (v && !/^https?:\/\/.+/.test(v) ? 'Must start with http:// or https://' : undefined),
  contactPerson: (v) => max(v, 150, 'Authorised signatory'),
  contactDesignation: (v) => max(v, 100, 'Designation'),
  contactCnic: (v) => (v && !isValidCnic(v) ? CNIC_ERROR : undefined),
  area: (v) => max(v, 150, 'Area'),
  address: (v) => max(v, 400, 'Campus address'),
  campusName: (v) => max(v, 200, 'Campus name'),
  studentCount: (v) => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    if (!Number.isInteger(n)) return 'Enter a whole number';
    if (n < 0) return 'Cannot be negative';
    if (n > 1_000_000) return 'Must be at most 1,000,000';
    return undefined;
  },
};

function max(v: string, limit: number, label: string): string | undefined {
  return v.length > limit ? `${label} must be at most ${limit} characters` : undefined;
}

export default function InstituteProfilePage() {
  const qc = useQueryClient();
  const catalogs = useCatalogs();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['institute', 'profile'],
    queryFn: () => instituteService.getProfile(),
  });
  const [form, setForm] = useState<FormState>(EMPTY);
  // Which fields the person has actually touched. Errors stay quiet until then, so a form that has
  // only just loaded is not already shouting at someone who has typed nothing.
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [changingChannel, setChangingChannel] = useState<ContactChannel | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      legalName: data.legalName ?? '',
      displayName: data.displayName ?? '',
      entityType: data.entityType ?? '',
      registrationNo: data.registrationNo ?? '',
      regulator: data.regulator ?? '',
      about: data.about ?? '',
      website: data.website ?? '',
      contactPerson: data.contactPerson ?? '',
      contactDesignation: data.contactDesignation ?? '',
      contactCnic: data.contactCnic ?? '',
      cityId: data.cityId ? String(data.cityId) : '',
      area: data.area ?? '',
      address: data.address ?? '',
      campusName: data.campusName ?? '',
      studentCount: data.studentCount != null ? String(data.studentCount) : '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (patch: SaveInstituteProfile) => instituteService.saveProfile(patch),
    onSuccess: () => {
      toast.success('Profile saved');
      qc.invalidateQueries({ queryKey: ['institute'] });
    },
    onError: (e) =>
      toast.error('Could not save', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  if (isLoading) return <LoadingState label="Loading your profile…" />;
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} message="Could not load your profile." />;
  }

  // Approving the registration approved these exact values, so a verified institute changing them
  // would reopen a settled question. The server refuses it too; this just says so before the trip.
  const identityLocked = data.status === 'VERIFIED';

  const set = (k: keyof FormState) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  /** The error for a field, shown only once it has been touched. */
  const errorFor = (k: keyof FormState): string | undefined =>
    touched[k] ? RULES[k]?.(form[k]) : undefined;

  /** Every rule, ignoring whether the field was touched — what the submit button is gated on. */
  const firstProblem = (): [keyof FormState, string] | null => {
    for (const key of Object.keys(RULES) as (keyof FormState)[]) {
      const message = RULES[key]?.(form[key]);
      if (message) return [key, message];
    }
    return null;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = firstProblem();
    if (problem) {
      // Reveal every error at once — someone who pressed Save wants the whole list, not the first
      // one and then another after each fix.
      setTouched(Object.fromEntries(Object.keys(RULES).map((k) => [k, true])));
      toast.error('Check the highlighted fields', { description: problem[1] });
      return;
    }
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
    // The server treats an omitted field as "leave it alone" and a blank one as "clear it", so a
    // text field the person has emptied is sent as '' — sending undefined would silently restore
    // the old value. (Numbers have no blank form to send, so clearing a count is not offered.)
    const text = (v: string) => v.trim();
    save.mutate({
      legalName: identityLocked ? undefined : text(form.legalName),
      registrationNo: identityLocked ? undefined : text(form.registrationNo),
      entityType: identityLocked
        ? undefined
        : ((text(form.entityType) || undefined) as InstituteEntityType | undefined),
      displayName: text(form.displayName),
      regulator: text(form.regulator),
      about: text(form.about),
      website: text(form.website),
      contactPerson: text(form.contactPerson),
      contactDesignation: text(form.contactDesignation),
      contactCnic: text(form.contactCnic),
      cityId: num(form.cityId),
      area: text(form.area),
      address: text(form.address),
      campusName: text(form.campusName),
      studentCount: num(form.studentCount),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Institute profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your legal details are checked against the documents you upload for verification.
        </p>
      </div>

      <Section
        title="Legal identity"
        note={identityLocked ? 'Verified and locked. Contact support if these need correcting.' : undefined}
        // The identity header sits at the top of the first card exactly as it does on the tutor's
        // profile: who this account is, with the image control on it. The logo is not a form field
        // — it saves the moment it is cropped — so it belongs here rather than among the inputs.
        header={
          <div className="flex items-center gap-4">
            <AvatarUpload
              url={data.logoUrl}
              name={form.displayName || form.legalName || 'Institute'}
              size={80}
              label="logo"
              onChange={() => qc.invalidateQueries({ queryKey: ['institute'] })}
            />
            <div>
              <h3 className="font-display text-lg font-bold">
                {form.displayName || form.legalName || 'Your institute'}
              </h3>
              <p className="text-sm text-muted-foreground">Institute account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Click the camera to change your logo.
              </p>
            </div>
          </div>
        }
      >
        <Text
          id="legalName"
          label="Legal name"
          hint="Exactly as written on your registration certificate"
          value={form.legalName}
          onChange={set('legalName')}
          error={errorFor('legalName')}
          disabled={identityLocked}
        />
        <Text
          id="displayName"
          label="Display name"
          hint="What teachers see"
          value={form.displayName}
          onChange={set('displayName')}
          error={errorFor('displayName')}
        />
        <div>
          <Label htmlFor="entityType">Institute type</Label>
          <Select value={form.entityType} onValueChange={set('entityType')} disabled={identityLocked}>
            <SelectTrigger id="entityType" className="mt-1.5">
              <SelectValue placeholder="How is your institute registered?" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Text
          id="registrationNo"
          label="Registration number"
          value={form.registrationNo}
          onChange={set('registrationNo')}
          error={errorFor('registrationNo')}
          disabled={identityLocked}
        />
        {/* The registered email is the account's login and where invoices go, so it is a proved
            fact rather than a text field: changing it takes a code sent to the new address, the
            same process a tutor goes through. */}
        <VerifiedContactField channel="EMAIL" value={user?.email} onEdit={setChangingChannel} />
        <Text
          id="regulator"
          label="Regulator"
          hint="The body you are registered with — varies by province"
          value={form.regulator}
          onChange={set('regulator')}
          error={errorFor('regulator')}
        />
      </Section>

      <Section title="Contact & location">
        <Text
          id="contactPerson"
          label="Authorised signatory"
          hint="The person who signs contracts for the institute"
          value={form.contactPerson}
          onChange={set('contactPerson')}
          error={errorFor('contactPerson')}
        />
        <Text
          id="contactDesignation"
          label="Designation"
          placeholder="Principal"
          value={form.contactDesignation}
          onChange={set('contactDesignation')}
          error={errorFor('contactDesignation')}
        />
        <Text
          id="contactCnic"
          label="CNIC of authorised person"
          placeholder="12345-1234567-1"
          inputMode="numeric"
          hint="Must match the CNIC document you upload for verification"
          value={form.contactCnic}
          onChange={set('contactCnic')}
          error={errorFor('contactCnic')}
        />
        {/* Same treatment as the email: the account's number, changed only by proving the new one. */}
        <VerifiedContactField channel="PHONE" value={user?.phone} onEdit={setChangingChannel} />
        <div>
          <Label htmlFor="cityId">City</Label>
          <Select value={form.cityId} onValueChange={set('cityId')}>
            <SelectTrigger id="cityId" className="mt-1.5">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {catalogs.cities.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Text
          id="area"
          label="Area"
          placeholder="DHA Phase 5"
          value={form.area}
          onChange={set('area')}
          error={errorFor('area')}
        />
        <Text
          id="address"
          label="Campus address"
          hint="Where your campus actually operates — teachers see this before applying"
          value={form.address}
          onChange={set('address')}
          error={errorFor('address')}
        />
        <Text
          id="website"
          label="Website"
          placeholder="https://"
          hint="Optional"
          value={form.website}
          onChange={set('website')}
          error={errorFor('website')}
        />
      </Section>

      <Section title="About">
        <Text
          id="campusName"
          label="Campus name"
          placeholder="Gulberg Campus"
          hint="Optional"
          value={form.campusName}
          onChange={set('campusName')}
          error={errorFor('campusName')}
        />
        <Text
          id="studentCount"
          label="Students enrolled"
          type="number"
          min={0}
          value={form.studentCount}
          onChange={set('studentCount')}
          error={errorFor('studentCount')}
        />
        <div className="sm:col-span-2">
          <Label htmlFor="about">Description</Label>
          <textarea
            id="about"
            rows={4}
            value={form.about}
            onChange={(e) => set('about')(e.target.value)}
            placeholder="Tell teachers about your institute — what you teach, your campuses, what it is like to work there."
            className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            {errorFor('about') ? (
              <p className="text-xs text-destructive">{errorFor('about')}</p>
            ) : (
              <span />
            )}
            {/* Only once it is worth knowing: a counter from zero is noise on an empty box. */}
            {form.about.length > 1500 && (
              <p className="text-xs tabular-nums text-muted-foreground">
                {form.about.length} / 2000
              </p>
            )}
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" variant="gradient" size="lg" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </Button>
      </div>

      {/* The store is the only copy of the email and phone on this page, so it has to be told
          about the change or the field keeps showing the old value until the next reload. */}
      <ContactChangeDialog
        channel={changingChannel}
        currentValue={changingChannel === 'PHONE' ? user?.phone : user?.email}
        onClose={() => setChangingChannel(null)}
        onChanged={(details) => {
          if (!user) return;
          setSession({ ...user, phone: details.phone, email: details.email }, getAccessToken() ?? '');
        }}
      />
    </form>
  );
}

function Section({
  title,
  note,
  header,
  children,
}: {
  title: string;
  note?: string;
  /** Optional identity block shown above the title, divided from it — see the first section. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-soft">
      {header && (
        <>
          {header}
          <Separator className="my-6" />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display font-bold">{title}</h2>
        {note && (
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> {note}
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Text({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  ...props
  // Omitted so the field's own value/onChange win: the inherited DOM types declare onChange as a
  // ChangeEventHandler, which would intersect with — and so contradict — the string setter below.
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={error ? 'mt-1.5 border-destructive' : 'mt-1.5'}
        {...props}
      />
      {/* The error replaces the hint rather than stacking with it: two lines of small grey text
          under one field, one of which is a complaint, is a row nobody reads. */}
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
