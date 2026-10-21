import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { adminService, type SystemParameterChange } from '@/services/adminService';
import { DataTable, type Column } from '@/components/admin/AdminKit';
import { TablePagination } from '@/components/common/TablePagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const columns: Column<SystemParameterChange>[] = [
  {
    header: 'Parameter',
    cell: (row) => (
      <span className="block max-w-64 break-words text-sm font-semibold">{row.key}</span>
    ),
  },
  {
    header: 'Change',
    cell: (row) => (
      <div className="flex min-w-36 items-center gap-2 text-sm tabular-nums">
        <span className="max-w-40 break-all text-muted-foreground">{row.previousValue}</span>
        <ArrowRight aria-label="changed to" className="h-4 w-4 shrink-0 text-primary" />
        <span className="max-w-40 break-all font-semibold">{row.newValue}</span>
      </div>
    ),
  },
  {
    header: 'Changed by',
    cell: (row) => (
      <div className="min-w-40">
        <p className="break-all font-medium">{row.adminEmail ?? `Admin #${row.actorId}`}</p>
        <p className="mt-1 text-xs text-muted-foreground">Admin #{row.actorId}</p>
      </div>
    ),
  },
  {
    header: 'Date & time (PKT)',
    cell: (row) => (
      <time dateTime={row.createdAt} className="block min-w-36 text-xs text-muted-foreground">
        {new Date(row.createdAt).toLocaleString('en-PK', {
          timeZone: 'Asia/Karachi',
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </time>
    ),
  },
  {
    header: 'Reason',
    cell: (row) => (
      <p className="min-w-48 max-w-sm whitespace-pre-wrap break-words text-sm">{row.note}</p>
    ),
  },
];

export function SystemParameterHistory({
  parameterKey,
  onClose,
}: {
  parameterKey?: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const query = useQuery({
    queryKey: ['admin', 'configuration-history', parameterKey ?? 'all', page, size],
    queryFn: ({ signal }) =>
      adminService.parameterHistory({ key: parameterKey, page, size }, signal),
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-6xl">
        <DialogHeader>
          <DialogTitle>Configuration change history</DialogTitle>
          <DialogDescription>
            {parameterKey ?? 'All system parameters'} · Latest changes first. Times shown in
            Pakistan time.
          </DialogDescription>
        </DialogHeader>
        {query.isPending ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : query.isError ? (
          <div className="space-y-3 py-6" role="alert">
            <p className="text-sm text-muted-foreground">Could not load configuration history.</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex max-h-[65vh] min-h-0 flex-col overflow-hidden rounded-xl border">
            <div className="min-h-0 flex-1">
              <DataTable
                embedded
                scrollable
                columns={columns}
                rows={query.data?.items ?? []}
                getKey={(row) => String(row.id)}
                empty="No configuration changes recorded yet."
              />
            </div>
            <TablePagination
              embedded
              page={page}
              pageSize={size}
              total={query.data?.total ?? 0}
              itemLabel="changes"
              disabled={query.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setSize(next);
                setPage(0);
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
