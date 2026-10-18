import { Hero } from '@/components/home/Hero';
import { PopularSubjects } from '@/components/home/PopularSubjects';
import { FeaturedTutors } from '@/components/home/FeaturedTutors';
import {
  StatsBar,
  WhyChoose,
  LearningJourney,
  SuccessStories,
  Testimonials,
  FinalCTA,
} from '@/components/home/Sections';
import { FaqSection } from '@/components/common/FaqSection';
import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { PricingCard } from '@/components/cards/PricingCard';
import { PRICING_TIERS } from '@/services/mock/misc';
import { HelpAssistant } from '@/components/assistant/HelpAssistant';
import { FeatureVideo } from '@/components/common/FeatureVideo';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-12 [&>section:first-child]:mb-0">
      <Hero />
      {/* Directly below the hero, and deliberately not inside it: the hero's job is the search
          box, and someone who scrolls past it has just asked "so who are you?". This is the
          first thing that answers. Hides itself when no media bucket is configured. */}
      <FeatureVideo
        eyebrow="Watch — 80 seconds"
        title="Every tutor. Fully checked."
        description="See how a tutor gets onto TopTutor — identity, degrees, a criminal background check, and a final human review before anyone teaches your child."
      />
      <StatsBar />
      <PopularSubjects />
      <WhyChoose />
      <FeaturedTutors />
      <LearningJourney />
      <SuccessStories />
      <Testimonials />

      {/* Pricing preview */}
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Start free. Upgrade only when you need priority matching and premium support."
        />
        <StaggerGroup className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((t) => (
            <StaggerItem key={t.id}>
              <PricingCard tier={t} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>

      <FaqSection />
      <FinalCTA />

      {/* Floats above the page rather than sitting in the flow, and hides itself when the
          assistant is not configured server-side. */}
      <HelpAssistant />
    </div>
  );
}
