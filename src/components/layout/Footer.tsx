import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Send } from 'lucide-react';
import { FOOTER_NAV } from '@/constants/navigation';
import { Logo } from '@/components/common/Logo';
import { Container } from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYMENT_METHODS } from '@/constants';
import { toast } from '@/components/ui/sonner';

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-secondary/40">
      <Container className="py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Pakistan’s first 6-step verified tutoring marketplace. Find safe, qualified,
              background-checked tutors — with secure escrow payments and total peace of mind.
            </p>
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success('Subscribed!', { description: 'You’ll receive our best tips & tutor highlights.' });
              }}
            >
              <label className="text-sm font-semibold">Join our newsletter</label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" required placeholder="you@email.com" className="pl-9" />
                </div>
                <Button type="submit" variant="gradient" size="icon" aria-label="Subscribe">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <h4 className="font-display text-sm font-bold">{col.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TopTutor. All rights reserved. Made in Pakistan 🇵🇰
          </p>
          <div className="flex items-center gap-3">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m.id}
                className="rounded-md border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                {m.name}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
              <Button key={i} variant="ghost" size="icon" aria-label="Social link" asChild>
                <a href="#" target="_blank" rel="noreferrer">
                  <Icon className="h-4.5 w-4.5" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
