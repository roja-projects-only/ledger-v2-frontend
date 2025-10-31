/**
 * TodayEntriesList - Display list of today's sale entries
 * 
 * Features:
 * - Sorted by time (most recent first)
 * - Uses EntryCard component
 * - Empty state message
 * - Edit/delete actions
 * - Infinite scroll pagination
 * - Responsive height matching
 */

import { useMemo } from "react";
import { EntryCard } from "@/components/shared/EntryCard";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import type { Sale, Customer } from "@/lib/types";
import { Package, Loader2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface TodayEntriesListProps {
  sales: Sale[];
  customers: Customer[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  loading?: boolean;
  itemsPerPage?: number;
}

// ============================================================================
// Component
// ============================================================================

export function TodayEntriesList({
  sales,
  customers,
  onEdit,
  onDelete,
  loading = false,
  itemsPerPage = 10,
}: TodayEntriesListProps) {
  const orderedSales = useMemo(() => {
    if (!sales.length) {
      return [] as Sale[];
    }

    return [...sales].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return bTime - aTime;
    });
  }, [sales]);

  // Infinite scroll pagination
  const {
    displayedItems,
    hasMore,
    observerRef,
    totalItems,
    displayedCount,
  } = useInfiniteScroll(orderedSales, { itemsPerPage, autoLoad: true });

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3" aria-live="polite">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (orderedSales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold">No entries yet today</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Use the Quick Add Entry form to add your first sale
        </p>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col" aria-label="Today's entries">
      <div className="flex-1 min-h-0">
        <div className="relative h-full">
          <div className="h-full overflow-y-auto pr-0" role="presentation">
            <ul className="flex flex-col gap-3" role="list">
              {displayedItems.map((sale) => {
                const customer = customers.find((c) => c.id === sale.customerId);
                return (
                  <li key={sale.id}>
                    <EntryCard
                      sale={sale}
                      customer={customer}
                      onEdit={onEdit ? () => onEdit(sale) : undefined}
                      onDelete={onDelete ? () => onDelete(sale) : undefined}
                    />
                  </li>
                );
              })}

              {hasMore && (
                <li>
                  <div ref={observerRef} className="h-4" aria-hidden="true" />
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/50 pt-3 mt-3 flex-shrink-0 px-0" aria-live="polite">
        {hasMore ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading more... ({displayedCount} of {totalItems})</span>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? "entry" : "entries"} total
          </p>
        )}
      </footer>
    </section>
  );
}
