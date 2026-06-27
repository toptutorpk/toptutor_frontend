import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'wide' | 'narrow';
}

export function Container({ className, size = 'default', ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full container-px',
        size === 'default' && 'max-w-7xl',
        size === 'wide' && 'max-w-[88rem]',
        size === 'narrow' && 'max-w-3xl',
        className,
      )}
      {...props}
    />
  );
}
