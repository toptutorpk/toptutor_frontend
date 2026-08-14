import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Typographic primitives for the legal documents.
 *
 * Legal copy is long, scanned rather than read, and quoted back at us clause by
 * clause. That asks for three things a generic prose style does not give:
 * a measure short enough to track across dense text, sub-headings that stay
 * visually subordinate to the numbered clause they sit under, and tables that
 * survive a phone screen. These primitives exist so both documents get that
 * treatment identically — and so a change to legal typography is one edit.
 */

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mt-4 text-[0.9375rem] leading-7 text-muted-foreground', className)}>
      {children}
    </p>
  );
}

/** Opening paragraph of a clause — slightly stronger than the body that follows. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-base leading-7 text-foreground/90">{children}</p>;
}

/** Sub-heading inside a numbered clause. Deliberately unnumbered: sub-numbering
 *  drifts out of sync with the auto-numbered clauses the moment one is added. */
export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 font-display text-base font-bold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

export function List({
  children,
  ordered = false,
}: {
  children: ReactNode;
  ordered?: boolean;
}) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      className={cn(
        'mt-4 space-y-2.5 pl-5 text-[0.9375rem] leading-7 text-muted-foreground',
        ordered ? 'list-decimal' : 'list-disc',
        // The marker carries the same muted tone as the text but at lower
        // weight, so a long list reads as one block rather than a column of dots.
        'marker:text-muted-foreground/50',
      )}
    >
      {children}
    </Tag>
  );
}

export function Item({ children }: { children: ReactNode }) {
  return <li className="pl-1.5">{children}</li>;
}

/** A defined term. Bolding the term makes the definitions clause scannable and
 *  signals, on later use, that the word carries its defined meaning. */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

type CalloutTone = 'info' | 'warning';

const calloutTones: Record<CalloutTone, string> = {
  info: 'border-brand-200/70 bg-brand-25 dark:border-brand-500/25 dark:bg-brand-500/10',
  // Reserved for the clauses a user is worst affected by missing — the limits
  // on what verification proves, and the liability caps.
  warning: 'border-gold-300/70 bg-gold-50 dark:border-gold-400/25 dark:bg-gold-400/10',
};

export function Callout({
  title,
  tone = 'info',
  children,
}: {
  title?: string;
  tone?: CalloutTone;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mt-6 rounded-[var(--radius-panel)] border p-5 text-[0.9375rem] leading-7',
        calloutTones[tone],
      )}
    >
      {title && <p className="font-display font-bold tracking-tight text-foreground">{title}</p>}
      <div className={cn('text-muted-foreground', title && 'mt-2')}>{children}</div>
    </div>
  );
}

/**
 * Data table used for the "what we collect / why / how long" disclosures.
 * Wrapped in its own scroll container so a three-column table never forces the
 * page body to scroll sideways on a phone.
 */
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-[var(--radius-panel)] border">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-secondary/50">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b px-4 py-3 font-display text-xs font-bold uppercase tracking-[0.1em] text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'border-b px-4 py-3.5 leading-6 text-muted-foreground',
                    j === 0 && 'font-medium text-foreground',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
