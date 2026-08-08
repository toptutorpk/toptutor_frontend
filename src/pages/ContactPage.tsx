import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Building2,
  GraduationCap,
  MessageSquare,
  Clock,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/common/Container';
import { Section } from '@/components/common/Section';
import { Reveal } from '@/components/animations/Reveal';
import { LottieAnimation } from '@/components/animations/LottieAnimation';
import { ContactIllustration } from '@/components/animations/illustrations/ContactIllustration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CITIES } from '@/constants';
import { contactService } from '@/services/contactService';
import { cn } from '@/lib/utils';

// ---- Form schema -----------------------------------------------------------

const HELP_TOPICS = [
  { value: 'find_tutor', label: 'Finding a tutor' },
  { value: 'become_tutor', label: 'Becoming a tutor' },
  { value: 'booking_payments', label: 'Booking & payments' },
  { value: 'institute', label: 'Institute partnership' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
] as const;

const ROLES = [
  { value: 'parent', label: 'Parent / Guardian' },
  { value: 'student', label: 'Student' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'institute', label: 'Institute / School' },
] as const;

const HEARD_FROM = [
  { value: 'search', label: 'Google / Search engine' },
  { value: 'social', label: 'Social media' },
  { value: 'friend', label: 'Friend or family' },
  { value: 'school', label: 'My school or institute' },
  { value: 'other', label: 'Other' },
] as const;

const contactSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Please enter your first name'),
    lastName: z.string().trim().min(2, 'Please enter your last name'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^(\+92|0)?3\d{9}$/, 'Enter a valid Pakistani mobile number (e.g. 03001234567)'),
    city: z.string().optional(),
    role: z.string().min(1, 'Please tell us who you are'),
    topics: z.array(z.string()).min(1, 'Select at least one topic'),
    requirement: z.string().trim().max(1000).optional(),
    heardFrom: z.string().min(1, 'Please pick an option'),
    heardFromOther: z.string().trim().optional(),
    comments: z.string().trim().max(1000).optional(),
    // A plain boolean + refine (rather than z.literal(true)) keeps the inferred
    // type `boolean`, so the checkbox can be toggled back off without casting.
    consent: z.boolean().refine((v) => v, {
      message: 'Please accept the privacy policy to continue',
    }),
  })
  // Mirrors the reference site's dependent-field behaviour: the "specify source"
  // input is only required once "Other" is chosen.
  .refine((v) => v.heardFrom !== 'other' || (v.heardFromOther?.length ?? 0) >= 2, {
    message: 'Please tell us where you heard about us',
    path: ['heardFromOther'],
  });

type ContactForm = z.infer<typeof contactSchema>;

// ---- Contact method cards --------------------------------------------------

interface ContactMethod {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  href: string;
  /** Renders the icon in a warning tone. */
  urgent?: boolean;
}

const CONTACT_METHODS: ContactMethod[] = [
  {
    icon: MessageSquare,
    title: 'General enquiries',
    description: 'Questions about how TopTutor works, pricing, or your account.',
    action: 'support@toptutor.pk',
    href: 'mailto:support@toptutor.pk',
  },
  {
    icon: GraduationCap,
    title: 'Tutor support',
    description: 'Help with verification, your profile, schedule or payouts.',
    action: 'tutors@toptutor.pk',
    href: 'mailto:tutors@toptutor.pk',
  },
  {
    icon: Building2,
    title: 'Institute partnerships',
    description: 'Bring TopTutor to your school, academy or learning centre.',
    action: 'partners@toptutor.pk',
    href: 'mailto:partners@toptutor.pk',
  },
  {
    icon: ShieldAlert,
    title: 'Report a safety concern',
    description: 'Child-safety and misconduct reports are reviewed within 24 hours.',
    action: 'safety@toptutor.pk',
    href: 'mailto:safety@toptutor.pk',
    urgent: true,
  },
];

// ---- Page ------------------------------------------------------------------

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactMethods />
      <ContactFormSection />
      <OfficeAndNewsletter />
      <ContactCta />
    </>
  );
}

function ContactHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-28 left-1/4 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute top-16 right-8 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
      </div>

      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="eyebrow">Contact us</p>
          <h1 className="heading-1 mt-4 text-balance">
            Let’s find the right <span className="text-gradient">next step</span> for your learner.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Whether you’re looking for a verified tutor, want to teach with us, or are bringing
            TopTutor to an institute — tell us what you need and the right person will get back to
            you.
          </p>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
            <div>
              <dt className="text-sm text-muted-foreground">Typical reply time</dt>
              <dd className="mt-1 flex items-center gap-2 font-display text-xl font-bold">
                <Clock className="h-5 w-5 text-brand-600" /> Under 4 hours
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Support hours</dt>
              <dd className="mt-1 font-display text-xl font-bold">Mon–Sat, 9am–9pm PKT</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <a href="#contact-form">
                Send us a message <ArrowRight />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="tel:+924238900000">
                <Phone /> +92 42 3890 0000
              </a>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto w-full max-w-lg">
          <LottieAnimation
            // Drop a real animation at this path to upgrade automatically.
            src="/lottie/contact.json"
            className="w-full"
            aria-label="Illustration of a contact form being submitted"
            fallback={<ContactIllustration className="h-auto w-full" />}
          />
        </Reveal>
      </Container>
    </section>
  );
}

function ContactMethods() {
  return (
    <Section
      tone="tint"
      eyebrow="Reach the right team"
      title="Four ways to get in touch"
      description="Pick the channel that matches your question and you’ll skip a hand-off."
      align="center"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CONTACT_METHODS.map((method, i) => (
          <Reveal key={method.title} delay={i * 0.08}>
            <a
              href={method.href}
              className={cn(
                'group flex h-full flex-col rounded-[var(--radius-card)] border bg-card p-7 shadow-soft transition-all duration-300',
                'hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift',
              )}
            >
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-[var(--radius-btn)] transition-colors',
                  method.urgent
                    ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                    : 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-250',
                )}
              >
                <method.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{method.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {method.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-250">
                {method.action}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function ContactFormSection() {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      role: '',
      topics: [],
      requirement: '',
      heardFrom: '',
      heardFromOther: '',
      comments: '',
      consent: false,
    },
  });

  const topics = watch('topics') ?? [];
  const heardFrom = watch('heardFrom');
  const role = watch('role');
  const city = watch('city');

  const toggleTopic = (value: string) => {
    const next = topics.includes(value)
      ? topics.filter((t) => t !== value)
      : [...topics, value];
    setValue('topics', next, { shouldValidate: true });
  };

  const onSubmit = async (values: ContactForm) => {
    setSubmitting(true);
    try {
      const { reference } = await contactService.submit({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        city: values.city || undefined,
        role: values.role,
        topics: values.topics,
        requirement: values.requirement || undefined,
        heardFrom: values.heardFrom,
        heardFromOther: values.heardFrom === 'other' ? values.heardFromOther : undefined,
        comments: values.comments || undefined,
      });
      toast.success('Message sent', {
        description: `Your reference is ${reference}. We’ll reply within 4 hours.`,
      });
      reset();
    } catch {
      toast.error('Could not send your message', {
        description: 'Please try again, or email support@toptutor.pk directly.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="contact-form" size="narrow" className="scroll-mt-24">
      <Reveal>
        <div className="text-center">
          <p className="eyebrow">Send a message</p>
          <h2 className="heading-2 mt-3">Tell us what you need</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The more detail you share, the better we can match you. Fields marked
            <span className="text-brand-600"> *</span> are required.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-12 rounded-[var(--radius-panel)] border bg-card p-6 shadow-soft sm:p-10"
        >
          {/* Identity ---------------------------------------------------- */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="First name" required error={errors.firstName?.message}>
              <Input
                {...register('firstName')}
                placeholder="Ayesha"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
              />
            </Field>
            <Field label="Last name" required error={errors.lastName?.message}>
              <Input
                {...register('lastName')}
                placeholder="Khan"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
              />
            </Field>
            <Field label="Email address" required error={errors.email?.message}>
              <Input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
            </Field>
            <Field label="Phone number" required error={errors.phone?.message}>
              <Input
                {...register('phone')}
                type="tel"
                placeholder="03001234567"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
              />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <Select value={city || undefined} onValueChange={(v) => setValue('city', v)}>
                <SelectTrigger aria-invalid={Boolean(errors.city)}>
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
            </Field>
            <Field label="I am a…" required error={errors.role?.message}>
              <Select
                value={role || undefined}
                onValueChange={(v) => setValue('role', v, { shouldValidate: true })}
              >
                <SelectTrigger aria-invalid={Boolean(errors.role)}>
                  <SelectValue placeholder="Select one" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Topics ------------------------------------------------------ */}
          <fieldset className="mt-8">
            <legend className="text-sm font-medium">
              What do you need help with? <span className="text-brand-600">*</span>
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {HELP_TOPICS.map((topic) => {
                const checked = topics.includes(topic.value);
                return (
                  <label
                    key={topic.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[var(--radius-btn)] border p-4 text-sm transition-all duration-200',
                      checked
                        ? 'border-brand-600 bg-brand-25 dark:bg-secondary'
                        : 'border-input hover:border-brand-300 hover:bg-brand-25/60 dark:hover:bg-secondary/50',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleTopic(topic.value)}
                      aria-label={topic.label}
                    />
                    <span className="font-medium">{topic.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.topics?.message && (
              <p className="mt-2 text-sm text-destructive">{errors.topics.message}</p>
            )}
          </fieldset>

          {/* Detail ------------------------------------------------------ */}
          <div className="mt-8 space-y-6">
            <Field
              label="Tell us about your requirement"
              hint="Subject, grade, preferred timings, online or at home — whatever helps."
              error={errors.requirement?.message}
            >
              <Textarea
                {...register('requirement')}
                placeholder="e.g. O-Level Physics for my son in Grade 10, twice a week, evenings, at home in Lahore."
                aria-invalid={Boolean(errors.requirement)}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="How did you hear about TopTutor?"
                required
                error={errors.heardFrom?.message}
              >
                <Select
                  value={heardFrom || undefined}
                  onValueChange={(v) => setValue('heardFrom', v, { shouldValidate: true })}
                >
                  <SelectTrigger aria-invalid={Boolean(errors.heardFrom)}>
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEARD_FROM.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Dependent field — only rendered once "Other" is picked. */}
              {heardFrom === 'other' && (
                <Field label="Please specify" required error={errors.heardFromOther?.message}>
                  <Input
                    {...register('heardFromOther')}
                    placeholder="Where did you hear about us?"
                    aria-invalid={Boolean(errors.heardFromOther)}
                  />
                </Field>
              )}
            </div>

            <Field label="Anything else?" error={errors.comments?.message}>
              <Textarea
                {...register('comments')}
                placeholder="Optional — extra context, questions, or a preferred callback time."
                className="min-h-[96px]"
                aria-invalid={Boolean(errors.comments)}
              />
            </Field>
          </div>

          {/* Consent + submit -------------------------------------------- */}
          <div className="mt-8 border-t pt-8">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={watch('consent')}
                onCheckedChange={(v) => setValue('consent', v === true, { shouldValidate: true })}
                className="mt-0.5"
                aria-invalid={Boolean(errors.consent)}
              />
              <span className="leading-relaxed text-muted-foreground">
                I agree that TopTutor may contact me about my enquiry and I accept the{' '}
                <Link to="/privacy" className="font-medium text-brand-600 underline underline-offset-4 dark:text-brand-250">
                  privacy policy
                </Link>
                . <span className="text-brand-600">*</span>
              </span>
            </label>
            {errors.consent?.message && (
              <p className="mt-2 text-sm text-destructive">{errors.consent.message}</p>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="mt-8 w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send message <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </form>
      </Reveal>
    </Section>
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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function OfficeAndNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setSubscribing(true);
    try {
      await contactService.subscribe(email);
      toast.success('You’re subscribed', { description: 'Look out for our next update.' });
      setEmail('');
    } catch {
      toast.error('Subscription failed', { description: 'Please try again in a moment.' });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <Section tone="tint">
      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[var(--radius-panel)] border bg-card p-8 shadow-soft sm:p-10">
            <p className="eyebrow">Head office</p>
            <h3 className="heading-3 mt-3">Come say hello</h3>
            <ul className="mt-8 space-y-6 text-sm">
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-250">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">TopTutor (Pvt) Ltd</p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    Arfa Software Technology Park
                    <br />
                    Ferozepur Road, Lahore 54600
                    <br />
                    Punjab, Pakistan
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-250">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">Phone</p>
                  <a
                    href="tel:+924238900000"
                    className="mt-1 block text-muted-foreground transition-colors hover:text-brand-600"
                  >
                    +92 42 3890 0000
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-250">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">Email</p>
                  <a
                    href="mailto:support@toptutor.pk"
                    className="mt-1 block text-muted-foreground transition-colors hover:text-brand-600"
                  >
                    support@toptutor.pk
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="flex h-full flex-col justify-center rounded-[var(--radius-panel)] bg-brand-950 p-8 text-white sm:p-10">
            <p className="eyebrow text-brand-200">Newsletter</p>
            <h3 className="heading-3 mt-3">Stay ahead of the curve</h3>
            <p className="mt-4 leading-relaxed text-brand-100/80">
              Study tips, exam-season guides and new tutor announcements. One email a month, no
              noise.
            </p>
            <form onSubmit={subscribe} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address for newsletter"
                className="border-white/20 bg-white/10 text-white placeholder:text-brand-100/60 dark:bg-white/10"
              />
              <Button type="submit" variant="lightOutline" disabled={subscribing}>
                {subscribing ? <Loader2 className="animate-spin" /> : 'Subscribe'}
              </Button>
            </form>
            <p className="mt-4 text-xs text-brand-100/60">
              Unsubscribe any time. We never share your address.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function ContactCta() {
  return (
    <Section tone="dark" align="center">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="heading-2">Ready to start learning?</h2>
        <p className="mt-5 text-lg leading-relaxed text-brand-100/80">
          Browse verified tutors in your city and book a demo session — you only pay once the
          session actually happens.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/tutors">
              Find a tutor <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="lightOutline" asChild>
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}
