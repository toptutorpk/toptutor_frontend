import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AccountBadge } from '@/components/admin/AdminKit';
import { adminLearnerService } from '@/services/adminLearnerService';
import { getInitials } from '@/lib/utils';
import { toNationalDisplay } from '@/lib/phone';

const date = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toLocaleString();
};

export default function AdminLearnerProfile() {
  const { id } = useParams();
  const accountId = Number(id);
  const validId = /^[1-9]\d*$/.test(id ?? '') && Number.isSafeInteger(accountId);
  const qc = useQueryClient();
  const [confirmation, setConfirmation] = useState<'active' | 'suspended' | null>(null);
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;
  const backTo =
    typeof from === 'string' && /^\/admin\/students(?:\?|$)/.test(from) ? from : '/admin/students';
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'learners', 'detail', accountId],
    queryFn: ({ signal }) => adminLearnerService.detail(accountId, signal),
    enabled: validId,
    staleTime: 0,
  });
  const name = data
    ? [data.firstName, data.lastName].filter(Boolean).join(' ') ||
      data.email ||
      `Account #${data.id}`
    : '';
  const statusMutation = useMutation({
    mutationFn: (status: 'active' | 'suspended') =>
      adminLearnerService.setStatus(accountId, status),
    onSuccess: (updated) => {
      qc.setQueryData(['admin', 'learners', 'detail', accountId], updated);
      void qc.invalidateQueries({ queryKey: ['admin', 'learners'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirmation(null);
      toast.success(updated.status === 'SUSPENDED' ? 'Account suspended' : 'Account re-activated');
    },
    onError: (error) => {
      toast.error('Could not update account status', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      void refetch();
    },
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backTo} aria-label="Back to Students & Parents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold">
            {data?.role === 'PARENT'
              ? 'Parent profile'
              : data?.role === 'STUDENT'
                ? 'Student profile'
                : 'Account profile'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Account information provided by the student or parent.
          </p>
        </div>
        {data && !isError && (
          <Button variant="outline" size="sm" asChild>
            <Link
              to={`/admin/bookings/accounts/${accountId}`}
              state={{ from: location.pathname + location.search }}
            >
              View bookings
            </Link>
          </Button>
        )}
      </div>
      <div>
        {isError || !validId ? (
          <div
            className="space-y-3 rounded-xl border p-6 text-sm text-muted-foreground"
            role="alert"
          >
            <p>Could not load this profile. The account may no longer be available.</p>
            <Button variant="outline" disabled={!validId} onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : isPending ? (
          <div className="space-y-4" aria-label="Loading profile" role="status">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : data ? (
          <div className="space-y-4 pb-1">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft">
              <Avatar className="h-16 w-16">
                <AvatarImage src={data.photoUrl} alt={name} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-display text-lg font-bold">{name}</h2>
                <p className="text-xs text-muted-foreground">Account #{data.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{data.role === 'PARENT' ? 'Parent' : 'Student'}</Badge>
                <AccountBadge
                  status={
                    data.status === 'ACTIVE'
                      ? 'active'
                      : data.status === 'SUSPENDED'
                        ? 'suspended'
                        : 'pending'
                  }
                />
              </div>
            </div>
            <section className="rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="mb-3 font-semibold">Personal & contact details</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" value={data.firstName} />
                <Field label="Last name" value={data.lastName} />
                <Field label="Email" value={data.email} />
                <Field label="Phone" value={toNationalDisplay(data.phone)} />
                <Field
                  label="Email verification"
                  value={
                    data.email ? (data.emailVerified ? 'Verified' : 'Not verified') : 'Not provided'
                  }
                />
                <Field
                  label="Phone verification"
                  value={
                    data.phone ? (data.phoneVerified ? 'Verified' : 'Not verified') : 'Not provided'
                  }
                />
                <Field label="City" value={data.city} />
              </dl>
            </section>
            {data.role === 'STUDENT' && (
              <section className="rounded-2xl border bg-card p-5 shadow-soft">
                <h3 className="mb-3 font-semibold">Education</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Grade / level" value={data.gradeLevel} />
                  <Field label="School" value={data.school} />
                </dl>
              </section>
            )}
            {data.role === 'PARENT' && (
              <section className="rounded-2xl border bg-card p-5 shadow-soft">
                <h3 className="mb-3 font-semibold">Children ({data.children.length})</h3>
                {data.children.length ? (
                  <div className="space-y-3">
                    {data.children.map((child) => (
                      <div key={child.id} className="rounded-lg border bg-secondary/20 p-3">
                        <h4 className="mb-3 break-words text-sm font-semibold">{child.name}</h4>
                        <dl className="grid gap-3 sm:grid-cols-2">
                          <Field label="Grade / level" value={child.gradeLevel} />
                          <Field label="School" value={child.school} />
                          <Field label="Gender" value={child.gender} />
                          <Field label="Learning notes" value={child.notes} />
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No children have been added.</p>
                )}
              </section>
            )}
            <section className="rounded-2xl border bg-card p-5 shadow-soft">
              <h3 className="mb-3 font-semibold">Account timeline</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Joined" value={date(data.createdAt)} />
                <Field label="Last active" value={date(data.lastActiveAt)} />
              </dl>
            </section>
            {(data.status === 'ACTIVE' || data.status === 'SUSPENDED') && (
              <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
                <div>
                  <h2 className="font-display text-lg font-bold">Account actions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.status === 'SUSPENDED'
                      ? 'Restore this account’s access to the platform.'
                      : 'Suspend this account’s access when account intervention is required.'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className={
                    data.status === 'ACTIVE'
                      ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10'
                      : undefined
                  }
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    setConfirmation(data.status === 'SUSPENDED' ? 'active' : 'suspended')
                  }
                >
                  <ShieldAlert className="h-4 w-4" />{' '}
                  {data.status === 'SUSPENDED' ? 'Re-activate account' : 'Suspend account'}
                </Button>
              </section>
            )}
          </div>
        ) : null}
      </div>
      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !statusMutation.isPending) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation === 'suspended' ? 'Suspend account?' : 'Re-activate account?'}
            </DialogTitle>
            <DialogDescription>
              {confirmation === 'suspended'
                ? 'This student or parent will lose access to the platform and their signed-in sessions will be revoked. Existing bookings and payments will remain unchanged.'
                : 'This restores the student or parent’s access to the platform.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmation === 'suspended' ? 'destructive' : 'gradient'}
              disabled={statusMutation.isPending || !data || isError}
              onClick={() => confirmation && statusMutation.mutate(confirmation)}
            >
              {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
        {value || 'Not provided'}
      </dd>
    </div>
  );
}
