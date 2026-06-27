import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { StaggerGroup, StaggerItem } from '@/components/animations/Stagger';
import { PricingCard } from '@/components/cards/PricingCard';
import { FaqSection } from '@/components/common/FaqSection';
import { PRICING_TIERS } from '@/services/mock/misc';
import { Container as C } from '@/components/common/Container';
import { Reveal } from '@/components/animations/Reveal';
import { formatPKR } from '@/lib/utils';

const COMMISSION = [
  { stage: 'New Tutor', sessions: '0 – 50', commission: '20%', keeps: '80%' },
  { stage: 'Growing Tutor', sessions: '51 – 200', commission: '17%', keeps: '83%' },
  { stage: 'Experienced Tutor', sessions: '201 – 500', commission: '14%', keeps: '86%' },
  { stage: 'Top / Master Tutor', sessions: '500+', commission: '10%', keeps: '90%' },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-20 py-12">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Pricing that puts trust first"
          description="Browse and message verified tutors for free. Upgrade for priority matching, or hire teachers at scale."
        />
        <StaggerGroup className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((t) => (
            <StaggerItem key={t.id}>
              <PricingCard tier={t} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>

      {/* Tutor commission */}
      <C>
        <Reveal className="rounded-3xl border bg-card p-8 shadow-soft lg:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Tutors keep more as they grow
            </h2>
            <p className="mt-3 text-muted-foreground">
              Our commission drops as you complete more sessions — loyalty is rewarded. Verification
              is a one-time fee of {formatPKR(750)}.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tutor Stage</th>
                  <th className="px-4 py-3 font-semibold">Sessions</th>
                  <th className="px-4 py-3 font-semibold">Commission</th>
                  <th className="px-4 py-3 font-semibold text-right">Tutor Keeps</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION.map((row, i) => (
                  <tr key={row.stage} className={i % 2 ? 'bg-secondary/20' : ''}>
                    <td className="px-4 py-3 font-medium">{row.stage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.sessions}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.commission}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-brand-600">
                      {row.keeps}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </C>

      <FaqSection />
    </div>
  );
}
