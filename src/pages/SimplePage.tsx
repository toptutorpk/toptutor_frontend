import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/animations/Reveal';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

/** Generic placeholder page for secondary routes (About, Blog, Legal, etc.). */
export default function SimplePage({ title }: { title: string }) {
  return (
    <Container size="narrow" className="py-20">
      <Reveal className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
          <Construction className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          This page is part of the TopTutor experience and is ready for content. The route,
          navigation and layout are fully wired — drop in copy or a CMS feed to go live.
        </p>
        <Button className="mt-8" variant="gradient" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </Reveal>
    </Container>
  );
}
