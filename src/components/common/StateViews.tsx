import { AlertTriangle, Inbox, Loader2, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="h-9 w-9 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-6" variant="gradient" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoResults({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No tutors match your filters"
      description="Try widening your search — adjust the price range, city, or remove some filters."
      action={onReset ? { label: 'Clear all filters', onClick: onReset } : undefined}
    />
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <AlertTriangle className="h-9 w-9 text-red-500" />
      </div>
      <h3 className="font-display text-lg font-semibold">Something went wrong</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {message ?? 'We couldn’t load this content. Please try again.'}
      </p>
      {onRetry && (
        <Button className="mt-6" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
