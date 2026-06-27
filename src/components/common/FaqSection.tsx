import { Container } from '@/components/common/Container';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/animations/Reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQS } from '@/services/mock/misc';

export function FaqSection({ items = FAQS }: { items?: { q: string; a: string }[] }) {
  return (
    <Container size="narrow">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions, answered"
        description="Everything you need to know about booking, payments and safety."
      />
      <Reveal className="mt-10">
        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Container>
  );
}
