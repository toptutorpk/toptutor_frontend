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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-12 [&>section:first-child]:mb-0">
      <Hero />
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
    </div>
  );
}
