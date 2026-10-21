import { cn } from '@/lib/utils';

function Skeleton({
  className,
  children,
  shimmerClassName,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmerClassName?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)} {...props}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 [transform:translateX(-100%)] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5 animate-[skeleton-shimmer_1.6s_infinite] motion-reduce:animate-none',
          shimmerClassName,
        )}
      />
    </div>
  );
}

export { Skeleton };
