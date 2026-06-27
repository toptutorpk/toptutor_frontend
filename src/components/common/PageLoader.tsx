import { Logo } from '@/components/common/Logo';

/** Full-screen loader shown during lazy route transitions. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="animate-pulse">
        <Logo showText={false} />
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
      </div>
    </div>
  );
}
