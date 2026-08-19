import { useEffect, useState } from 'react';
import { Bell, Globe, Lock, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { accountService } from '@/services/accountService';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';

/**
 * Account settings — notifications and security.
 *
 * <p>Split out of the profile page: editing who you are and changing how the account behaves are
 * different errands, and bundling them meant the profile form carried two tabs that had nothing to
 * do with it. The cards themselves are unchanged.
 */
export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your notifications and account security." />
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <ChangePasswordCard />
            <SecuritySettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */
const NOTIFICATION_PREFS = [
  { icon: Bell, label: 'Session reminders', desc: 'SMS & push 24h and 1h before sessions', on: true },
  { icon: Globe, label: 'New tutor matches', desc: 'When a tutor matches your requirement', on: true },
  { icon: Bell, label: 'Promotions & tips', desc: 'Occasional product updates and offers', on: false },
];

function NotificationSettings() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      {NOTIFICATION_PREFS.map((n, i) => (
        <div key={n.label}>
          {i > 0 && <Separator className="my-4" />}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <n.icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <div>
                <div className="font-medium">{n.label}</div>
                <div className="text-sm text-muted-foreground">{n.desc}</div>
              </div>
            </div>
            <Switch defaultChecked={n.on} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Change password (all roles with a password)                               */
/* -------------------------------------------------------------------------- */
function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const submit = async () => {
    if (!current || !next || !confirm) {
      setError('Please fill in all three fields.');
      return;
    }
    if (next.length < 8) {
      setError('Your new password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    if (next === current) {
      setError('Your new password must be different from the current one.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await accountService.changePassword(current, next);
      toast.success('Password changed', { description: 'Use your new password next time you log in.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e) {
      // e.g. "Current password is incorrect" from the server.
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <h3 className="flex items-center gap-2 font-display font-bold">
        <Lock className="h-4 w-4" /> Change password
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2 sm:max-w-sm">
          <Label htmlFor="cur-pw">Current password</Label>
          <Input
            id="cur-pw"
            type="password"
            autoComplete="off"
            placeholder="Enter your current password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              clearError();
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pw">New password</Label>
          <Input
            id="new-pw"
            type="password"
            autoComplete="new-password"
            placeholder="Choose a new password"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              clearError();
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conf-pw">Confirm new password</Label>
          <Input
            id="conf-pw"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearError();
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      <Button variant="gradient" className="mt-4" disabled={saving} onClick={submit}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Update password
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Security — two-factor auth + delete account (all roles)                   */
/* -------------------------------------------------------------------------- */
function SecuritySettings() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [twoFactor, setTwoFactor] = useState<boolean | null>(null);
  const [savingTfa, setSavingTfa] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasPassword, setHasPassword] = useState(true); // assume until /me confirms
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    accountService
      .me()
      .then((m) => {
        if (cancelled) return;
        setTwoFactor(m.twoFactorEnabled);
        setHasPassword(m.hasPassword);
      })
      .catch(() => !cancelled && setTwoFactor(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTfa = async (next: boolean) => {
    setSavingTfa(true);
    try {
      await accountService.setTwoFactor(next);
      setTwoFactor(next);
      toast.success(next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled', {
        description: next ? 'You’ll enter an emailed code each time you log in.' : undefined,
      });
    } catch (e) {
      toast.error('Could not update two-factor authentication', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSavingTfa(false);
    }
  };

  const confirmDelete = async () => {
    if (hasPassword && !deletePassword) {
      setDeleteError('Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await accountService.deleteAccount(deletePassword);
      toast.success('Your account has been deleted');
      logout();
      navigate('/', { replace: true });
    } catch (e) {
      // Surface "Incorrect password" (and anything else) inline so the dialog stays open.
      setDeleteError(e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.');
      setDeleting(false);
    }
  };

  const closeConfirm = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setDeletePassword('');
      setDeleteError(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border bg-card p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <h3 className="font-display font-bold">Two-factor authentication</h3>
            <p className="text-sm text-muted-foreground">
              Require a one-time code emailed to {user?.email ?? 'your email'} each time you log in.
            </p>
          </div>
        </div>
        <Switch checked={!!twoFactor} disabled={twoFactor === null || savingTfa} onCheckedChange={toggleTfa} />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
        <div>
          <h3 className="font-display font-bold text-red-700 dark:text-red-400">Delete account</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/70">
            Permanently delete your account. This can’t be undone.
          </p>
        </div>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={closeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deactivates your account and removes your personal details. You’ll be signed
              out immediately and won’t be able to log back in. Past bookings and receipts are retained for
              records but are no longer linked to you. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {hasPassword && (
            <div className="space-y-2 rounded-xl border bg-secondary/30 p-4">
              <Label htmlFor="delete-password" className="text-sm font-medium">
                Enter your password to confirm
              </Label>
              <Input
                id="delete-password"
                type="password"
                autoFocus
                placeholder="••••••••"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                aria-invalid={!!deleteError}
                className="mt-1"
              />
              {deleteError && <p className="pt-0.5 text-xs font-medium text-red-500">{deleteError}</p>}
            </div>
          )}
          {!hasPassword && deleteError && <p className="text-xs text-red-500">{deleteError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => closeConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting || (hasPassword && !deletePassword)}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
