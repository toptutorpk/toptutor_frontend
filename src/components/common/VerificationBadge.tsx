import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationStatus } from '@/types';

const CONFIG: Record<
  VerificationStatus,
  { label: string; icon: typeof ShieldCheck; classes: string; dot: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  partial: {
    label: 'Partial Verified',
    icon: ShieldAlert,
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  under_review: {
    label: 'Under Review',
    icon: ShieldQuestion,
    classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
};

interface Props {
  status: VerificationStatus;
  size?: 'sm' | 'md';
  withDot?: boolean;
  className?: string;
}

export function VerificationBadge({ status, size = 'md', withDot, className }: Props) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        cfg.classes,
        className,
      )}
    >
      {withDot ? (
        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      ) : (
        <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      {cfg.label}
    </span>
  );
}
