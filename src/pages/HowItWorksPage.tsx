import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import { LearningJourney, FinalCTA } from '@/components/home/Sections';
import { FaqSection } from '@/components/common/FaqSection';
import { VERIFICATION_STEPS } from '@/constants';
import { ShieldCheck } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-24 py-12">
      <Container>
        {/* Counted off the step list rather than written out, so the page can never advertise a
            number of checks that does not match the ones printed underneath it. */}
        <SectionHeading
          eyebrow="How it works"
          title={`Safety you can see, in ${VERIFICATION_STEPS.length} steps`}
          description={`Before any tutor appears on TopTutor, they pass a rigorous ${VERIFICATION_STEPS.length}-step verification. No exceptions.`}
        />
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {VERIFICATION_STEPS.map((step, i) => (
            <Reveal key={step.id} delay={i * 0.05}>
              <div className="flex gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">
                  {step.id}
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                    {step.label}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Only after all {VERIFICATION_STEPS.length} steps pass does a tutor receive the green
                Verified Badge.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>

      <LearningJourney />
      <FaqSection />
      <FinalCTA />
    </div>
  );
}
