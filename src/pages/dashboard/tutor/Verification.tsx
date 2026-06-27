import { Upload, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { VERIFICATION_STEPS } from '@/constants';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

// Map demo statuses onto the 7 steps.
const STATUS: ('passed' | 'pending' | 'todo')[] = [
  'passed',
  'passed',
  'passed',
  'passed',
  'pending',
  'todo',
  'todo',
];

export default function TutorVerification() {
  const done = STATUS.filter((s) => s === 'passed').length;
  const pct = Math.round((done / VERIFICATION_STEPS.length) * 100);

  return (
    <div>
      <PageHeader title="Get Verified" description="Complete all 7 steps to earn your green Verified Badge." />

      <div className="mb-6 rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-display text-lg font-bold">Verification progress</span>
          </div>
          <Badge variant="gold">{done}/7 complete</Badge>
        </div>
        <Progress value={pct} className="mt-4 bg-white/20" indicatorClassName="bg-gold-400" />
        <p className="mt-2 text-sm text-white/80">
          {pct}% done — finish the remaining steps to go live and start receiving bookings.
        </p>
      </div>

      <div className="space-y-3">
        {VERIFICATION_STEPS.map((step, i) => {
          const status = STATUS[i];
          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center',
                status === 'passed' && 'border-emerald-200 dark:border-emerald-500/20',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold',
                  status === 'passed' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
                  status === 'pending' && 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
                  status === 'todo' && 'bg-secondary text-muted-foreground',
                )}
              >
                {step.id}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{step.label}</h3>
                  {status === 'passed' && <Badge variant="success">Passed</Badge>}
                  {status === 'pending' && <Badge variant="info">In review</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
              {status === 'todo' && (
                <Button variant="outline" onClick={() => toast.success(`${step.label} uploaded`)}>
                  <Upload className="h-4 w-4" /> Upload
                </Button>
              )}
              {status === 'pending' && (
                <Button variant="ghost" disabled>
                  Awaiting review
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
