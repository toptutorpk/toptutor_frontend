import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import {
  hiringService,
  type EmploymentType,
  type SendOffer,
} from '@/services/instituteService';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { noNegative } from '@/lib/utils';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  VISITING: 'Visiting',
};

const NONE = 'NONE';

/**
 * Floor for the start date, matching the "Role starts" field on a job posting.
 *
 * <p>date-fns rather than `toISOString().slice(0, 10)`: that is UTC, and at UTC+5 any evening
 * after 7pm it returns yesterday — so the floor would quietly admit a past date for five hours
 * of every day.
 */
const today = () => format(new Date(), 'yyyy-MM-dd');

/** Who the offer is going to, and where it came from. */
export interface OfferTarget {
  tutorId: number;
  tutorName: string;
  /** Set when the offer grew out of an application, so the two stay linked. */
  applicationId?: number;
  /** Pre-fills the role title when offering against a job post. */
  suggestedTitle?: string;
}

/**
 * Composes an offer.
 *
 * <p>Shared by the teacher search and the applicant list because an offer is the same object
 * whichever way the institute arrived at the teacher — and a second composer would be a second
 * place for the terms to drift.
 */
export function SendOfferDialog({
  target,
  onClose,
}: {
  target: OfferTarget | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [salary, setSalary] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');

  useEffect(() => {
    if (!target) return;
    setTitle(target.suggestedTitle ?? '');
    setSalary('');
    setEmploymentType('');
    setStartsOn('');
    setMessage('');
    setExpiresInDays('7');
  }, [target]);

  const send = useMutation({
    mutationFn: (payload: SendOffer) => hiringService.sendOffer(payload),
    onSuccess: () => {
      toast.success('Offer sent', {
        description: `${target?.tutorName} has been asked to accept or decline.`,
      });
      qc.invalidateQueries({ queryKey: ['institute', 'offers'] });
      qc.invalidateQueries({ queryKey: ['institute', 'billing'] });
      onClose();
    },
    onError: (e) =>
      toast.error('Could not send offer', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    send.mutate({
      tutorId: target.tutorId,
      applicationId: target.applicationId,
      title: title.trim(),
      employmentType: (employmentType || undefined) as EmploymentType | undefined,
      monthlySalary: Number(salary),
      startsOn: startsOn || undefined,
      message: message.trim() || undefined,
      expiresInDays: Number(expiresInDays) || undefined,
    });
  };

  const valid = title.trim().length > 0 && Number(salary) > 0;

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Offer a role to {target?.tutorName}</DialogTitle>
          <DialogDescription>
            They accept terms, not a conversation — so the salary is required. Accepting creates a
            placement, and the placement fee is charged once you both confirm they started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="offerTitle">Role</Label>
            <Input
              id="offerTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O-Level Physics Teacher"
              className="mt-1.5"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="offerSalary">Monthly salary (PKR)</Label>
              <Input
                id="offerSalary"
                type="number"
                inputMode="numeric"
                min={0}
                value={salary}
                onChange={(e) => setSalary(noNegative(e.target.value))}
                placeholder="55000"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="offerType">Role type</Label>
              <Select
                value={employmentType || NONE}
                onValueChange={(v) => setEmploymentType(v === NONE ? '' : v)}
              >
                <SelectTrigger id="offerType" className="mt-1.5">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not specified</SelectItem>
                  {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="offerStarts">Start date</Label>
              {/* Optional, like the employment type above it — hence the same "Not specified"
                  wording rather than a generic "Select a date". */}
              <DatePicker
                id="offerStarts"
                value={startsOn}
                min={today()}
                onChange={setStartsOn}
                placeholder="Not specified"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="offerExpiry">They have (days to reply)</Label>
              <Input
                id="offerExpiry"
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                value={expiresInDays}
                // min/max are honoured by the spinner but not by typing, and this form submits
                // through react-query so nothing consults :invalid either.
                onChange={(e) => setExpiresInDays(noNegative(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="offerMessage">Message</Label>
            <textarea
              id="offerMessage"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              placeholder="Anything else about the role, the timetable, or your campus."
              className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={!valid || send.isPending}>
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send offer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
