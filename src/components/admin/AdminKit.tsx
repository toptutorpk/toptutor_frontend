import type { ReactNode } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AccountStatus, VerifyStatus } from '@/services/mock/admin';

/** Card wrapper used across admin panels. */
export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border bg-card shadow-soft', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b p-5">
          <div>
            {title && <h2 className="font-display text-base font-bold">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** Toolbar row: title/count on the left, filters/actions on the right. */
export function Toolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

/** Generic responsive data table used by every admin listing. */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty = 'No records found.',
  embedded = false,
  scrollable = false,
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  empty?: string;
  /** Omit the outer card when a parent panel also contains pagination. */
  embedded?: boolean;
  /** Constrain rows to the parent's height and keep headings visible. */
  scrollable?: boolean;
}) {
  const alignCls = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
  return (
    <div
      className={cn(
        embedded ? 'bg-card' : 'overflow-hidden rounded-2xl border bg-card shadow-soft',
        scrollable && 'flex h-full min-h-0 flex-col',
      )}
    >
      <div
        className={
          scrollable ? 'min-h-0 flex-1 overflow-auto overscroll-contain' : 'overflow-x-auto'
        }
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'region' : undefined}
        aria-label={scrollable ? 'Scrollable records' : undefined}
      >
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 font-semibold',
                    scrollable &&
                      'sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--color-border)]',
                    alignCls(c.align),
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={getKey(r)} className="transition-colors hover:bg-secondary/30">
                {columns.map((c, i) => (
                  <td key={i} className={cn('px-4 py-3', alignCls(c.align), c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">{empty}</div>
        )}
      </div>
    </div>
  );
}

/** Avatar + name + subtext cell. */
export function PersonCell({ name, sub, avatar }: { name: string; sub?: string; avatar?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        {avatar && <AvatarImage src={avatar} alt={name} />}
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

const ACCOUNT_META: Record<
  AccountStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'destructive' },
};

export function AccountBadge({ status, className }: { status: AccountStatus; className?: string }) {
  const m = ACCOUNT_META[status];
  return (
    <Badge variant={m.variant} className={className}>
      {m.label}
    </Badge>
  );
}

const VERIFY_META: Record<
  VerifyStatus,
  { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary' }
> = {
  verified: { label: 'Verified', variant: 'success' },
  partial: { label: 'Partial', variant: 'warning' },
  under_review: { label: 'Under review', variant: 'info' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  not_started: { label: 'Not started', variant: 'secondary' },
};

export function VerifyBadge({ status }: { status: VerifyStatus }) {
  const m = VERIFY_META[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
