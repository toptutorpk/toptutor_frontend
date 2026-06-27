import { useState } from 'react';
import { CalendarDays, Phone, ShieldCheck, Zap, Check } from 'lucide-react';
import { cn, formatPKR } from '@/lib/utils';
import type { Tutor } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PAYMENT_METHODS } from '@/constants';
import { toast } from '@/components/ui/sonner';

export function BookingPanel({ tutor }: { tutor: Tutor }) {
  const [selectedPkg, setSelectedPkg] = useState(tutor.packages[1]?.id ?? tutor.packages[0].id);
  const pkg = tutor.packages.find((p) => p.id === selectedPkg) ?? tutor.packages[0];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display text-2xl font-extrabold">{formatPKR(tutor.hourlyRate)}</span>
          <span className="text-sm text-muted-foreground">/hour</span>
        </div>
        <Badge variant="success">
          <Zap className="h-3 w-3" /> Available
        </Badge>
      </div>

      {/* Packages */}
      <div className="mt-5 space-y-2">
        {tutor.packages.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPkg(p.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all',
              selectedPkg === p.id
                ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                : 'hover:border-brand-200 hover:bg-secondary/50',
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{p.title}</span>
                {p.popular && <Badge variant="gold" className="text-[10px]">Best value</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.sessions} session{p.sessions > 1 ? 's' : ''} · {formatPKR(p.pricePerSession)}/session
              </div>
            </div>
            <span className="font-display font-bold">{formatPKR(p.totalPrice)}</span>
          </button>
        ))}
      </div>

      {/* Selected perks */}
      <ul className="mt-4 space-y-1.5">
        {pkg.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-brand-500" /> {perk}
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2">
        <BookingDialog tutor={tutor} total={pkg.totalPrice} title={pkg.title} />
        <Button variant="outline" size="lg" className="w-full">
          <Phone className="h-4 w-4" /> Free 15-min intro call
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-secondary/60 p-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Payment held in escrow · released after your session
      </div>
    </div>
  );
}

function BookingDialog({ tutor, total, title }: { tutor: Tutor; total: number; title: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'slot' | 'pay' | 'done'>('slot');
  const [method, setMethod] = useState<string>('jazzcash');
  const [slot, setSlot] = useState<string>();

  const reset = () => {
    setStep('slot');
    setSlot(undefined);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="w-full">
          <CalendarDays className="h-4 w-4" /> Book a Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === 'slot' && (
          <>
            <DialogHeader>
              <DialogTitle>Choose a time slot</DialogTitle>
              <DialogDescription>
                {title} with {tutor.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2">
              {tutor.availability.slice(0, 3).flatMap((day) =>
                day.slots
                  .filter((s) => s.available)
                  .slice(0, 2)
                  .map((s) => {
                    const id = `${day.day}-${s.time}`;
                    return (
                      <button
                        key={id}
                        onClick={() => setSlot(id)}
                        className={cn(
                          'rounded-xl border p-2.5 text-center text-sm transition-all',
                          slot === id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                            : 'hover:bg-secondary',
                        )}
                      >
                        <div className="font-semibold">{day.day}</div>
                        <div className="text-xs text-muted-foreground">{s.time}</div>
                      </button>
                    );
                  }),
              )}
            </div>
            <Button
              variant="gradient"
              size="lg"
              disabled={!slot}
              onClick={() => setStep('pay')}
              className="mt-2"
            >
              Continue to payment
            </Button>
          </>
        )}

        {step === 'pay' && (
          <>
            <DialogHeader>
              <DialogTitle>Secure payment</DialogTitle>
              <DialogDescription>
                Pay {formatPKR(total)} — held in escrow until your session is complete.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                    method === m.id ? 'border-brand-500 ring-1 ring-brand-500' : 'hover:bg-secondary',
                  )}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
                  <span className="text-sm font-medium">{m.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-lg font-bold">{formatPKR(total)}</span>
            </div>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => {
                setStep('done');
                toast.success('Booking confirmed!', {
                  description: 'Your payment is safely held in escrow.',
                });
              }}
            >
              Pay {formatPKR(total)}
            </Button>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">Booking confirmed!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You’ll get an SMS & push reminder 24 hours and 1 hour before your session with{' '}
              {tutor.name}.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
