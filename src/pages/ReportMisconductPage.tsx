import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertTriangle,
  BadgeX,
  Ban,
  Check,
  Copy,
  CreditCard,
  FileWarning,
  Loader2,
  Lock,
  LogIn,
  MessagesSquare,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { Section } from '@/components/common/Section';
import { Reveal } from '@/components/animations/Reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import {
  reportService,
  type MisconductReceipt,
  type ReportCategory,
} from '@/services/reportService';

/* -------------------------------------------------------------------------- */
/*  What can be reported                                                       */
/* -------------------------------------------------------------------------- */

interface CategoryOption {
  value: ReportCategory;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Mirrors ReportCategory.urgent() on the server — shown so the reporter knows it is escalated. */
  urgent?: boolean;
}

/**
 * Eight, with an example each.
 *
 * <p>People do not arrive knowing our taxonomy; they arrive knowing what happened to them. The
 * one-line hint is what turns "harassment?" into "yes, that is the one" without making anyone
 * read a policy page first.
 */
const CATEGORIES: CategoryOption[] = [
  {
    value: 'CHILD_SAFETY',
    label: 'Child safety',
    hint: 'Anything that put a child at risk, including private contact with a minor.',
    icon: ShieldAlert,
    urgent: true,
  },
  {
    value: 'HARASSMENT',
    label: 'Harassment or abuse',
    hint: 'Threats, bullying, sexual harassment or unwanted contact after being asked to stop.',
    icon: UserX,
    urgent: true,
  },
  {
    value: 'FRAUD',
    label: 'Fraud or scam',
    hint: 'Payment taken outside the platform, a refund never honoured, impersonation for money.',
    icon: CreditCard,
    urgent: true,
  },
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Inappropriate content',
    hint: 'Sexual, violent or otherwise unsuitable material in a profile, message or session.',
    icon: FileWarning,
    urgent: true,
  },
  {
    value: 'FAKE_CREDENTIALS',
    label: 'Fake credentials',
    hint: 'Degrees, transcripts or ID documents that look forged, borrowed or not their own.',
    icon: BadgeX,
  },
  {
    value: 'OFF_PLATFORM',
    label: 'Taking it off-platform',
    hint: 'Being pushed to pay or arrange lessons outside TopTutor, losing payment protection.',
    icon: MessagesSquare,
  },
  {
    value: 'DISCRIMINATION',
    label: 'Discrimination',
    hint: 'Being treated worse because of religion, gender, ethnicity or disability.',
    icon: Scale,
  },
  {
    value: 'OTHER',
    label: 'Something else',
    hint: 'Anything that broke the rules but does not fit the categories above.',
    icon: Ban,
  },
];

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [ReportCategory, ...ReportCategory[]];

const SUBJECT_ROLES = [
  { value: 'TUTOR', label: 'A tutor' },
  { value: 'STUDENT', label: 'A student' },
  { value: 'PARENT', label: 'A parent' },
  { value: 'INSTITUTE', label: 'An institute' },
  { value: 'UNKNOWN', label: 'I am not sure' },
] as const;

const CHANNELS = [
  { value: 'CHAT', label: 'In TopTutor messages' },
  { value: 'SESSION', label: 'During a lesson' },
  { value: 'LISTING', label: 'On a profile or listing' },
  { value: 'PAYMENT', label: 'Around a payment' },
  { value: 'OFF_PLATFORM', label: 'Somewhere off TopTutor' },
  { value: 'OTHER', label: 'Somewhere else' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Today, in the viewer's own timezone.
 *
 * <p>Not `toISOString().slice(0, 10)`: that converts to UTC first, and east of Greenwich it hands
 * back yesterday for the first hours of every day — which would reject a report about something
 * that happened this morning.
 */
const today = () => format(new Date(), 'yyyy-MM-dd');

/**
 * The schema.
 *
 * <p>Two required fields and nothing else, matching the server. The temptation on a form like
 * this is to demand a name, an email and a date so the team has something to work with — but the
 * people who most need to report are often the least able to supply those, and every extra
 * mandatory box is a reason to abandon the page. A vague report is still a report.
 */
const schema = z
  .object({
    category: z.enum(CATEGORY_VALUES, { message: 'Choose what the report is about' }),
    description: z
      .string()
      .trim()
      .min(30, 'Please give at least a couple of sentences so we can look into it')
      .max(4000, 'Please keep this under 4000 characters'),
    subjectName: z.string().trim().max(160, 'Please keep this under 160 characters').optional(),
    subjectRole: z.string().optional(),
    subjectProfileUrl: z
      .string()
      .trim()
      .max(500, 'Please keep this under 500 characters')
      .optional(),
    channel: z.string().optional(),
    occurredOn: z
      .string()
      .optional()
      .refine((v) => !v || v <= today(), 'The date cannot be in the future'),
    accurate: z.boolean().refine((v) => v, {
      message: 'Please confirm the report is accurate before sending it',
    }),
  });
// Nothing here collects the reporter's name, email or phone. Reporting requires an account, so
// those are read from it server-side — see ReachYou below, which shows what will be attached.

type ReportForm = z.infer<typeof schema>;

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The public "Report Misconduct" page, linked from Trust &amp; Safety in the footer.
 *
 * <p>Filing requires an account. A report can end with someone suspended or removed, so each one
 * has to be attributable — and an unauthenticated form is trivially flooded. Someone who cannot
 * sign in is pointed at Contact Us rather than left with nowhere to go.
 */
export default function ReportMisconductPage() {
  const [receipt, setReceipt] = useState<MisconductReceipt | null>(null);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      <Hero />
      <EmergencyBand />
      {/* The gate is here rather than on the submit button. Letting someone describe being
          harassed across five sections and only then telling them to sign in would lose the
          report and the goodwill with it. */}
      {!user ? (
        <SignInFirst />
      ) : receipt ? (
        <Submitted receipt={receipt} onFileAnother={() => setReceipt(null)} />
      ) : (
        <ReportForm onFiled={setReceipt} />
      )}
      <HowItIsHandled />
    </>
  );
}

/**
 * What a signed-out visitor sees instead of the form.
 *
 * <p>It says why the account is needed. "Sign in to continue" with no reason reads as an
 * obstacle; saying that reports are acted on and so have to be attributable makes it a rule
 * rather than a hurdle. The route back is preserved so signing in returns them here.
 */
function SignInFirst() {
  return (
    <Section size="narrow">
      <Reveal>
        <div className="rounded-[var(--radius-2xl)] border bg-card p-8 shadow-soft">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-btn)] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <LogIn className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
            Sign in to file a report
          </h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Reports can lead to an account being suspended or removed, so each one has to be tied
            to a real account. Signing in also lets us come back to you with a question and tell
            you the outcome.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="gradient">
              <Link to="/login" state={{ from: '/report' }}>
                Log in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/signup">Create an account</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            If you cannot sign in — or the account you would use is the one at risk — write to us
            through{' '}
            <Link to="/contact" className="font-medium text-brand-600 hover:underline">
              Contact Us
            </Link>{' '}
            and the Trust &amp; Safety team will pick it up from there.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function Hero() {
  return (
    <Section size="narrow" className="pb-0" align="left">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trust &amp; Safety
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Report misconduct
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          If something on TopTutor was unsafe, dishonest or against the rules, tell us here. Every
          report is read by a person, and we will never tell the other party who reported them.
        </p>
      </Reveal>
    </Section>
  );
}

/**
 * The band that has to come before the form.
 *
 * <p>A safety form invites people in real trouble, and this one is read by a human in office
 * hours. Saying so, before anyone starts typing, is the difference between a slow reply and
 * somebody waiting on us instead of calling for help.
 */
function EmergencyBand() {
  return (
    <Container size="narrow" className="pt-8">
      <Reveal>
        <div className="flex gap-4 rounded-[var(--radius-2xl)] border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-red-900 dark:text-red-200">
              If someone is in immediate danger, contact the authorities first.
            </p>
            <p className="mt-1 text-red-800/90 dark:text-red-200/80">
              Call <strong>15</strong> for police, or the Madadgaar national helpline on{' '}
              <strong>1098</strong> for child protection. This form is reviewed by our team during
              working hours — it is not monitored around the clock, so please do not wait on it in
              an emergency.
            </p>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}

function ReportForm({ onFiled }: { onFiled: (receipt: MisconductReceipt) => void }) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: undefined,
      description: '',
      subjectName: '',
      subjectRole: '',
      subjectProfileUrl: '',
      channel: '',
      occurredOn: '',
      accurate: false,
    },
  });

  const category = watch('category');
  const subjectRole = watch('subjectRole');
  const channel = watch('channel');
  const description = watch('description') ?? '';
  const accurate = watch('accurate');
  const occurredOn = watch('occurredOn');

  const onSubmit = async (values: ReportForm) => {
    setSubmitting(true);
    try {
      const receipt = await reportService.submit({
        category: values.category,
        description: values.description.trim(),
        subjectName: values.subjectName || undefined,
        subjectRole: (values.subjectRole || undefined) as never,
        subjectProfileUrl: values.subjectProfileUrl || undefined,
        channel: (values.channel || undefined) as never,
        occurredOn: values.occurredOn || undefined,
        // Nothing identifying the reporter is sent. The server takes that from the session and
        // resolves their contact details from the account.
      });
      onFiled(receipt);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast.error('Your report was not sent', { description: whyItFailed(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section size="narrow">
      <Reveal>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10" noValidate>
          {/* ---- 1. What happened ------------------------------------------ */}
          <fieldset className="space-y-4">
            <Step n={1} title="What are you reporting?" />
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((option) => (
                <CategoryCard
                  key={option.value}
                  option={option}
                  selected={category === option.value}
                  onSelect={() =>
                    setValue('category', option.value, { shouldValidate: true })
                  }
                />
              ))}
            </div>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </fieldset>

          {/* ---- 2. Who ----------------------------------------------------- */}
          <fieldset className="space-y-4">
            <Step
              n={2}
              title="Who is this about?"
              note="Every field here is optional. Tell us what you know."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name or profile title" error={errors.subjectName?.message}>
                <Input placeholder="e.g. Ayesha R." {...register('subjectName')} />
              </Field>
              <Field label="They are">
                <Select
                  value={subjectRole || undefined}
                  onValueChange={(v) => setValue('subjectRole', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label="Link to their profile or listing"
              hint="Paste the page address if you have it — it is the fastest way for us to find them."
              error={errors.subjectProfileUrl?.message}
            >
              <Input placeholder="https://toptutor.pk/tutors/…" {...register('subjectProfileUrl')} />
            </Field>
          </fieldset>

          {/* ---- 3. Where and when ------------------------------------------ */}
          <fieldset className="space-y-4">
            <Step n={3} title="Where and when?" note="Optional, but it helps us find the evidence." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Where did it happen?">
                <Select value={channel || undefined} onValueChange={(v) => setValue('channel', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {/* The same picker as the CNIC issue date. Its month/year drill-down earns its
                  keep here too: a report is often about something from months ago, and paging a
                  month grid backwards one chevron at a time is the reason people give up and
                  leave the field blank. */}
              <Field label="When did it happen?" error={errors.occurredOn?.message}>
                <DatePicker
                  id="occurred-on"
                  value={occurredOn ?? ''}
                  max={today()}
                  invalid={Boolean(errors.occurredOn)}
                  onChange={(next) => setValue('occurredOn', next, { shouldValidate: true })}
                  placeholder="Select the date"
                />
              </Field>
            </div>
          </fieldset>

          {/* ---- 4. The account ---------------------------------------------- */}
          <fieldset className="space-y-4">
            <Step n={4} title="What happened?" required />
            <Field
              label="Describe it in your own words"
              required
              hint="Include what was said or done, and anything that would help us check it — message dates, a booking reference, a lesson time. Please do not paste anyone's ID card or bank details."
              error={errors.description?.message}
            >
              <Textarea
                rows={7}
                maxLength={4000}
                placeholder="Tell us what happened…"
                {...register('description')}
              />
            </Field>
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {description.trim().length} / 4000
            </p>
          </fieldset>

          {/* ---- 5. You ------------------------------------------------------ */}
          {/* Not a section of the form — nothing here is an input. It exists so nobody has to
              guess what we will send with their report, and so a wrong number on the account is
              noticed here rather than when the team fails to reach them. */}
          <ReachYou />

          {/* ---- Submit ------------------------------------------------------ */}
          <div className="space-y-4 border-t pt-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={accurate}
                onCheckedChange={(v) => setValue('accurate', v === true, { shouldValidate: true })}
                className="mt-0.5"
              />
              <span className="leading-relaxed text-muted-foreground">
                Everything in this report is true as far as I know. I understand that knowingly
                filing a false report can lead to my account being suspended.
              </span>
            </label>
            {errors.accurate && <p className="text-sm text-destructive">{errors.accurate.message}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" variant="gradient" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Sending…' : 'Submit report'}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Sent over an encrypted connection and read only by our Trust &amp; Safety team.
              </p>
            </div>
          </div>
        </form>
      </Reveal>
    </Section>
  );
}

/**
 * One short line telling the reporter what to do next.
 *
 * <p>The raw server message is only shown for a 400, where it is written for people and names the
 * field to fix. Everything else gets plain language rather than wire text like "Authentication is
 * required to access the resource".
 *
 * <p>The 401/403 line is reachable in normal use: the page gates the form on the auth store, but
 * a session can expire between loading the page and pressing submit, and the server is the one
 * that notices. Telling them to sign in is then exactly right.
 */
function whyItFailed(e: unknown): string {
  const status = e instanceof ApiError ? e.status : undefined;

  if (status === 400) {
    return e instanceof Error ? e.message : 'Please check the form and try again.';
  }
  if (status === 429) {
    return 'Several reports have come from this connection already. Please try again later.';
  }
  if (status === undefined) {
    return 'You may be offline. Check your connection and try again.';
  }
  if (status === 401 || status === 403) {
    return 'You need to be logged in to your account to file a report.';
  }
  return 'Something went wrong on our side. Please try again in a moment.';
}

/* -------------------------------------------------------------------------- */
/*  After submitting                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The receipt.
 *
 * <p>The reference is the whole point of this screen. It is what a reporter quotes to reach their
 * case without anyone having to describe the incident again from memory — which is why it is
 * large, copyable, and paired with an instruction to keep it.
 */
function Submitted({
  receipt,
  onFileAnother,
}: {
  receipt: MisconductReceipt;
  onFileAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy', { description: 'Please write the reference down instead.' });
    }
  };

  return (
    <Section size="narrow">
      <Reveal>
        <div className="rounded-[var(--radius-2xl)] border bg-card p-8 shadow-soft">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-btn)] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
            Thank you — your report has been received
          </h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {receipt.urgent
              ? 'This has been flagged to our Trust & Safety team for review today.'
              : 'It is now in our Trust & Safety queue and will be reviewed by a person.'}
          </p>

          <div className="mt-6 rounded-[var(--radius-2xl)] border border-dashed bg-secondary/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your reference
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="font-display text-2xl font-extrabold tracking-wider">
                {receipt.reference}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copy}>
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Please keep this. Quote it in any follow-up and we can find your report without you
              having to go through it all again.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gradient">
              <Link to="/">Back to home</Link>
            </Button>
            <Button type="button" variant="outline" onClick={onFileAnother}>
              File another report
            </Button>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  What happens next                                                          */
/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    title: 'A person reads it',
    body: 'Every report is read by our Trust & Safety team — nothing here is decided automatically. Child-safety, harassment, fraud and inappropriate-content reports are looked at the same working day.',
  },
  {
    title: 'We check what we can',
    body: 'We review the account, its verification documents, and where relevant the TopTutor messages and booking records tied to it. This is why keeping conversations on the platform matters.',
  },
  {
    title: 'We act, and tell you',
    body: 'Depending on what we find, an account can be warned, suspended or permanently removed, and a payment held in escrow can be returned. If you left contact details, we will tell you the outcome.',
  },
];

function HowItIsHandled() {
  return (
    <Section
      size="narrow"
      tone="tint"
      eyebrow="What happens next"
      title="How we handle a report"
      description="Reporting something takes a minute and can be uncomfortable. Here is exactly what it sets in motion."
    >
      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.06}>
            <li className="flex gap-4 rounded-[var(--radius-2xl)] border bg-card p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display font-bold tracking-tight">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <p className="mt-8 text-sm text-muted-foreground">
        For how we protect under-18s, see{' '}
        <Link to="/child-safety" className="font-medium text-brand-600 hover:underline">
          Child Safety
        </Link>
        . For anything that is not misconduct, use{' '}
        <Link to="/contact" className="font-medium text-brand-600 hover:underline">
          Contact Us
        </Link>
        .
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function Step({ n, title, note, required }: { n: number; title: string; note?: string; required?: boolean }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold tracking-tight">
        <span className="text-brand-600">{n}.</span> {title}
        {required && <span className="text-brand-600"> *</span>}
      </h2>
      {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

/** A selectable category. A real radio underneath, so keyboard and screen readers get a real group. */
function CategoryCard({
  option,
  selected,
  onSelect,
}: {
  option: CategoryOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-[var(--radius-2xl)] border bg-card p-4 transition-colors',
        'hover:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2',
        selected && 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10',
      )}
    >
      <input
        type="radio"
        name="category"
        className="sr-only"
        checked={selected}
        onChange={onSelect}
      />
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-btn)] transition-colors',
          selected
            ? 'bg-brand-600 text-white'
            : 'bg-secondary text-muted-foreground',
        )}
      >
        <option.icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
          {option.label}
          {option.urgent && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-500/20 dark:text-red-300">
              Priority
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
          {option.hint}
        </span>
      </span>
    </label>
  );
}

/**
 * What we will attach to the report, taken from the account.
 *
 * <p>Read-only. The reporter is signed in, so the platform already holds a name, an email and a
 * phone number that went through registration — asking them to type it again adds work and
 * invites a typo into the one detail that has to be right. Shown rather than merely used,
 * because a person about to report something serious should not have to trust that we got it
 * right, and a stale number is worth catching now.
 */
function ReachYou() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'my-contact'],
    queryFn: () => reportService.myContact(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="rounded-[var(--radius-2xl)] border bg-secondary/25 p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold tracking-tight">
        <UserCheck className="h-4 w-4 text-brand-600" />
        We will contact you at
      </h3>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <Detail label="Name" value={data?.name} loading={isLoading} />
        <Detail label="Email" value={data?.email} loading={isLoading} />
        <Detail label="Phone" value={data?.phone} loading={isLoading} />
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Taken from your account, so there is nothing to fill in — partly hidden here in case
        someone is looking over your shoulder. The team sees it in full.{' '}
        <Link to="/dashboard/student/profile" className="font-medium text-brand-600 hover:underline">
          Update your details
        </Link>{' '}
        if any of this is out of date. The person you are reporting is never told who reported
        them.
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string | null;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">
        {loading ? <span className="inline-block h-4 w-28 animate-pulse rounded bg-muted" /> : value || '—'}
      </dd>
    </div>
  );
}

/** Label + control + error/hint, so every field lines up identically. */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
