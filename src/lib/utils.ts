import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Pakistani Rupees, e.g. PKR 2,500. */
export function formatPKR(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && amount >= 1000) {
    const formatter = new Intl.NumberFormat('en-PK', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return `PKR ${formatter.format(amount)}`;
  }
  return `PKR ${new Intl.NumberFormat('en-PK').format(amount)}`;
}

/** Compact number, e.g. 12500 -> 12.5k */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Initials from a full name, e.g. "Ayesha Khan" -> "AK". */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Simple async delay (used to simulate network latency in mocks). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pluralize a word given a count. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Deterministic pseudo-random colour for avatars without images. */
export function colorFromString(str: string): string {
  const colors = [
    'bg-brand-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-fuchsia-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
