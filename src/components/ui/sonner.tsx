import { Toaster as Sonner } from 'sonner';
import { useUIStore } from '@/store/uiStore';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  const theme = useUIStore((s) => s.theme);
  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border shadow-lg font-sans',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
