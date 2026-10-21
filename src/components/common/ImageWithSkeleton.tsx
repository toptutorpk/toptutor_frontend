import { useCallback, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ImageWithSkeletonProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Reserve dimensions here (e.g. aspect-video or h-full w-full) to avoid layout shifts. */
  containerClassName?: string;
  skeletonClassName?: string;
  skeletonVariant?: 'image' | 'document';
  fallback?: ReactNode;
}

/** A fresh loading lifecycle for each URL, including signed URL renewals. No shared URL cache. */
export function ImageWithSkeleton(props: ImageWithSkeletonProps) {
  return <ImageContent key={props.src ?? ''} {...props} />;
}

function ImageContent({
  containerClassName,
  skeletonClassName,
  skeletonVariant = 'image',
  fallback,
  className,
  alt = '',
  onLoad,
  onError,
  ...props
}: ImageWithSkeletonProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    // Cached images may finish before React attaches load listeners. Resolve before paint.
    if (node?.complete) setStatus(node.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  return (
    <div
      className={cn('relative isolate overflow-hidden', containerClassName)}
      aria-busy={status === 'loading'}
    >
      {status === 'loading' && (
        <Skeleton
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full rounded-[inherit]',
            skeletonVariant === 'document' && 'bg-slate-200 dark:bg-slate-700',
            skeletonClassName,
          )}
          shimmerClassName={
            skeletonVariant === 'document'
              ? 'via-white/90 dark:via-white/20 animate-[skeleton-shimmer_1.35s_ease-in-out_infinite]'
              : undefined
          }
        />
      )}
      {status === 'error' ? (
        <div
          role="img"
          aria-label={`${alt || 'Image'} could not be loaded`}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/40 p-4 text-center text-muted-foreground"
        >
          {fallback ?? (
            <>
              <ImageOff aria-hidden="true" className="h-6 w-6" />
              <span className="text-xs">Image unavailable</span>
            </>
          )}
        </div>
      ) : (
        <img
          {...props}
          ref={imageRef}
          alt={alt}
          className={cn(
            'block h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            className,
          )}
          onLoad={(event) => {
            setStatus('loaded');
            onLoad?.(event);
          }}
          onError={(event) => {
            setStatus('error');
            onError?.(event);
          }}
        />
      )}
    </div>
  );
}
