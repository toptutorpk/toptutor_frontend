import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Printer } from 'lucide-react';
import { Container } from '@/components/common/Container';
import { cn } from '@/lib/utils';
import {
  DOCUMENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
} from '@/constants/legal';

export interface LegalClause {
  /** Anchor target. Stable across edits — these get cited and bookmarked. */
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  summary: ReactNode;
  clauses: LegalClause[];
  /** Cross-link to the companion document, rendered in the footer band. */
  companion: { to: string; label: string; description: string };
}

/** Sticky navbar is h-16 / lg:h-18, so anchored headings need to clear ~72px
 *  plus breathing room or the clause title lands underneath it. */
const SCROLL_OFFSET = 112;

/**
 * Shared shell for the Privacy Policy and Terms of Service.
 *
 * Both documents are long enough that the table of contents is the primary
 * navigation, not decoration: users arrive from a checkbox link looking for one
 * clause. The contents panel therefore tracks the reader's position rather than
 * sitting inert, and every clause is independently linkable so support can send
 * someone straight to the clause under discussion.
 */
export function LegalDocument({
  eyebrow,
  title,
  summary,
  clauses,
  companion,
}: LegalDocumentProps) {
  const activeId = useActiveClause(clauses);

  return (
    <>
      {/* Header band ------------------------------------------------------- */}
      <section className="border-b bg-brand-25 dark:bg-secondary/40">
        <Container className="py-14 lg:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="heading-1 mt-3">{title}</h1>
            <div className="mt-6 text-base leading-7 text-muted-foreground">{summary}</div>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t pt-6 text-sm">
              <MetaItem label="Effective date" value={LEGAL_EFFECTIVE_DATE} />
              <MetaItem label="Last updated" value={LEGAL_LAST_UPDATED} />
              <MetaItem label="Version" value={DOCUMENT_VERSION} />
            </dl>
          </div>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
          <TableOfContents clauses={clauses} activeId={activeId} />

          {/* Clauses ------------------------------------------------------- */}
          <div className="min-w-0 max-w-2xl">
            {clauses.map((clause, i) => (
              <section
                key={clause.id}
                id={clause.id}
                className="scroll-mt-28 border-b border-border/60 pb-10 pt-10 first:pt-0 last:border-b-0"
              >
                <h2 className="flex gap-3 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                  {/* Clause numbers are derived from position rather than stored
                      in the content, so inserting a clause renumbers the whole
                      document instead of leaving a duplicate or a gap. */}
                  <span className="shrink-0 text-brand-600 dark:text-brand-400">{i + 1}.</span>
                  <span>{clause.title}</span>
                </h2>
                {clause.body}
              </section>
            ))}

            <CompanionLink companion={companion} />
          </div>
        </div>
      </Container>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function TableOfContents({
  clauses,
  activeId,
}: {
  clauses: LegalClause[];
  activeId: string | null;
}) {
  return (
    <aside className="mb-12 lg:mb-0">
      <div className="lg:sticky lg:top-24">
        <p className="eyebrow">Contents</p>
        {/* Capped and scrollable: at ~20 clauses the list is taller than most
            laptop viewports, and a sticky panel that overflows the screen hides
            its own last entries. */}
        <nav className="mt-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
          <ol className="space-y-1">
            {clauses.map((clause, i) => {
              const isActive = clause.id === activeId;
              return (
                <li key={clause.id}>
                  <a
                    href={`#${clause.id}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex gap-2.5 rounded-[var(--radius-btn)] px-3 py-2 text-sm leading-snug transition-colors',
                      isActive
                        ? 'bg-brand-100 font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                  >
                    <span className="shrink-0 tabular-nums opacity-60">{i + 1}.</span>
                    <span>{clause.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 flex flex-wrap gap-2 border-t pt-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground"
          >
            <Printer className="h-3.5 w-3.5" /> Print / save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Back to top
          </button>
        </div>
      </div>
    </aside>
  );
}

function CompanionLink({ companion }: { companion: LegalDocumentProps['companion'] }) {
  return (
    <Link
      to={companion.to}
      className="mt-12 flex items-center justify-between gap-6 rounded-[var(--radius-panel)] border bg-secondary/40 p-6 transition-colors hover:border-brand-300 hover:bg-secondary/70"
    >
      <div>
        <p className="font-display font-bold tracking-tight">{companion.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{companion.description}</p>
      </div>
      <span aria-hidden className="text-xl text-brand-600 dark:text-brand-400">
        &rarr;
      </span>
    </Link>
  );
}

/**
 * Reports which clause the reader is currently inside.
 *
 * Resolved from element positions on scroll rather than with an
 * IntersectionObserver: the reliable definition of "current" here is the last
 * heading to have crossed the navbar, and an observer only reports headings as
 * they enter or leave the viewport — it says nothing about a clause long enough
 * to fill the screen, which is exactly the case in these documents.
 */
function useActiveClause(clauses: LegalClause[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const ids = clauses.map((c) => c.id);

    const resolve = () => {
      frame.current = null;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET) current = id;
      }
      setActiveId(current);
    };

    // Coalesce to one measurement per frame — scroll fires far faster than the
    // highlight can meaningfully change, and each pass reads layout.
    const onScroll = () => {
      if (frame.current === null) frame.current = window.requestAnimationFrame(resolve);
    };

    resolve();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [clauses]);

  return activeId;
}
