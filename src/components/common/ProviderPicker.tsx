import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CatalogItem } from '@/services/catalogService';
import { findInstitution } from '@/constants/banks';
import { BankLogo } from './BankLogo';

/**
 * A searchable picker for the bank/wallet catalog.
 *
 * <p>The search box appears only once the list is long enough to need it: nine wallets are quicker
 * to read than to filter, twenty-nine banks are not.
 */
export function ProviderPicker({
  id,
  items,
  value,
  onChange,
  placeholder,
  disabled,
  searchPlaceholder = 'Search…',
}: {
  id: string;
  items: CatalogItem[];
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Placeholder for the search box shown on long lists, e.g. 'Search bank…'. */
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const searchable = items.length > 10;

  // The query is per opening, not per session: reopening the list to change a choice should show
  // everything again rather than whatever was last typed.
  useEffect(() => {
    if (open) {
      setQuery('');
      if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  const selected = items.find((i) => i.value === value || i.label === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 text-left text-sm shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {selected && <BankLogo name={selected.label} size="sm" />}
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected?.label ?? placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // At least as wide as the trigger, but never so narrow that "United Bank Limited (UBL)"
        // truncates — the trigger is half-width inside the two-column row.
        className="w-[var(--radix-popover-trigger-width)] min-w-[19rem] overflow-hidden rounded-2xl p-0"
        onOpenAutoFocus={(e) => searchable && e.preventDefault()}
        // Inside a Dialog (the refund step), the dialog's scroll lock listens for wheel/touch on the
        // document and cancels any that start outside it — and this list is portalled outside it.
        // Stopping them here keeps them off the document, so the list scrolls natively; nothing
        // behind the dialog can scroll, because the event never leaves this list.
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {searchable && (
          <div className="relative border-b">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 w-full bg-transparent pl-11 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
        <div className="no-scrollbar max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches “{query}”.
            </p>
          ) : (
            filtered.map((item) => {
              const active = item.value === value;
              const subtitle = findInstitution(item.label)?.subtitle;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                    'hover:bg-brand-50/70 focus-visible:bg-brand-50/70 focus-visible:outline-none dark:hover:bg-brand-500/10',
                    active && 'bg-brand-50 dark:bg-brand-500/15',
                  )}
                >
                  <BankLogo name={item.label} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-sm font-semibold',
                        active && 'text-brand-700 dark:text-brand-300',
                      )}
                    >
                      {item.label}
                    </span>
                    {subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {subtitle}
                      </span>
                    )}
                  </span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
