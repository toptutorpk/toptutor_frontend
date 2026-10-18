import { useEffect, useState } from 'react';
import { Ban, CircleUserRound, Link2Off, ShieldAlert, Video, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RULES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Link2Off,
    title: 'Don’t share the classroom link',
    body: 'The classroom is only for you and the other person in this session. Anyone else who joins is reported.',
  },
  {
    icon: ShieldAlert,
    title: 'Don’t share personal information',
    body: 'Sessions may be recorded and are reviewed by TopTutor. Never share phone numbers, addresses, social media or payment details.',
  },
  {
    icon: Ban,
    title: 'Breaking these rules can get your account suspended',
    body: 'That includes sharing the link, your contact details or your login.',
  },
];

/**
 * The rules shown before every classroom join. Joining needs the box ticked, so nobody can say they
 * weren't told. "Join classroom" is the real click, so the new tab it opens isn't blocked as a pop-up.
 */
export function ClassroomRulesDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const email = useAuthStore((s) => s.user?.email);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Before you join</DialogTitle>
          <DialogDescription>
            Sessions may be recorded. Please read these rules before you go in.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {RULES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        {email && (
          <div className="flex gap-3 rounded-xl border bg-secondary/50 p-3">
            <CircleUserRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sign in to Google as <span className="font-semibold text-foreground">{email}</span>.
              The classroom only lets in the email on your TopTutor account.
            </p>
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5"
          />
          <span>I understand the rules, and I know this session may be recorded and is reviewed.</span>
        </label>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gradient" disabled={!agreed} onClick={onConfirm}>
            <Video /> Join classroom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
