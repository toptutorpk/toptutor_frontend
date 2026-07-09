import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '@/config/env';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* Minimal typing for the Google Identity Services global. */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** Loads the Google Identity Services script once and resolves when it's ready. */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
}

/** Google's multi-colour "G" logo. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.46h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.75Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.12A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.12Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.12C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * Renders a themed "Continue with Google" button. A visible button matching the app's
 * outline button style sits underneath Google's real (invisible, opacity-0) rendered button,
 * which captures the click and hands the Google ID token (credential) to {@link onCredential}.
 * Renders a disabled placeholder when no client id is configured.
 */
export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (idToken: string) => void;
  onError?: (error: unknown) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gsiRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const handleResponse = useCallback(
    (response: { credential?: string }) => {
      if (response.credential) onCredential(response.credential);
    },
    [onCredential],
  );

  // Track the wrapper width so Google's fixed-px button can span the full row.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!env.googleClientId || width === 0) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !gsiRef.current) return;
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: handleResponse,
        });
        // Re-render on width changes: renderButton takes a fixed px width.
        gsiRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(gsiRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width,
        });
      })
      .catch((error) => onError?.(error));
    return () => {
      cancelled = true;
    };
  }, [handleResponse, onError, width]);

  if (!env.googleClientId) {
    return (
      <div className="rounded-md border border-dashed p-2.5 text-center text-xs text-muted-foreground">
        Google sign-in isn’t configured (set <code>VITE_GOOGLE_CLIENT_ID</code>).
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Visible, themed button — matches the outline Button (variant="outline" size="lg"). */}
      <div
        aria-hidden="true"
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'pointer-events-none w-full')}
      >
        <GoogleLogo />
        Continue with Google
      </div>
      {/* Google's real button, invisible on top, capturing the click. Scaled to fill the height. */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-0">
        <div ref={gsiRef} className="scale-y-150" />
      </div>
    </div>
  );
}
