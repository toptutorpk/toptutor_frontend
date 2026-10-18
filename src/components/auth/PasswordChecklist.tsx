import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isStrongPassword, passwordChecklist } from '@/lib/password';

/**
 * The outstanding password requirements, live as the person types.
 *
 * <p>Withdraws entirely once the password satisfies all of them. The list is instruction, and
 * instruction that has been followed is just clutter sitting between the field and the button —
 * its disappearance is itself the confirmation that nothing is left to do. It stays away until
 * there is something to say again, so an edit that breaks a rule brings it straight back.
 *
 * <p>Shared by every sign-up form (tutor, institute, learner) so one policy is stated one way.
 * The rules come from {@code lib/password}, which is kept in step with the backend's
 * {@code @StrongPassword} validator — a checklist that disagrees with the server is worse than no
 * checklist, because it promises a password the server will then refuse.
 */
export function PasswordChecklist({ password }: { password: string }) {
  if (isStrongPassword(password)) return null;

  return (
    <ul className="grid grid-cols-1 gap-1 rounded-xl border bg-secondary/40 p-3 sm:grid-cols-2">
      {passwordChecklist(password).map((rule) => (
        <li
          key={rule.label}
          className={cn(
            'flex items-center gap-1.5 text-[11px]',
            rule.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {rule.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
