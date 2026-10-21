import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  pageSizes?: readonly number[];
  embedded?: boolean;
}

/** Controlled pagination: each module owns its query, filters, URL and loading state. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = 'records',
  pageSizes = PAGE_SIZE_OPTIONS,
  embedded = false,
}: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? page * pageSize + 1 : 0;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className={`flex shrink-0 flex-wrap items-center justify-between gap-4 bg-card px-4 py-3 ${embedded ? 'border-t' : 'mt-4 rounded-xl border'}`}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {from}–{to}
          </span>{' '}
          of <span className="font-medium text-foreground">{total.toLocaleString()}</span>{' '}
          {itemLabel}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            disabled={disabled}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-9 w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="px-1 text-xs text-muted-foreground" aria-live="polite">
          Page {page + 1} of {pages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page + 1 >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
