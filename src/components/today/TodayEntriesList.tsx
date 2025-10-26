/**
 * TodayEntriesList - Display list of today's sale entries
 * 
 * Features:
 * - Sorted by time (most recent first)
 * - Uses EntryCard component
 * - Empty state message
 * - Edit/delete actions
 * - Infinite scroll pagination
 */

import { useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>("calc(100vh - 500px)");

  // Recalculate height on resize
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const container = containerRef.current.closest('.grid');
        if (container) {
          // Get the top position of the scrollable area
          const scrollableDiv = containerRef.current.querySelector('.overflow-y-auto');
          if (scrollableDiv) {
            const rect = scrollableDiv.getBoundingClientRect();
            // Calculate remaining space from current position to bottom
            const availableHeight = window.innerHeight - rect.top - 80; // 80px buffer for footer and spacing
            setMaxHeight(`${Math.max(availableHeight, 400)}px`);
          }
        }
      }
    };

    // Calculate on mount
    calculateHeight();

    // Recalculate on resize/zoom
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Infinite scroll pagination
  const {
    displayedItems,
    hasMore,
    observerRef,
    totalItems,
    displayedCount,
  } = useInfiniteScroll(sales, { itemsPerPage, autoLoad: true });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (sales.length === 0) {
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
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Scrollable container with responsive height */}
      <div className="overflow-y-auto pr-2 space-y-3" style={{ maxHeight, minHeight: "400px" }}>
        {displayedItems.map((sale) => {
          const customer = customers.find((c) => c.id === sale.customerId);
          return (
            <EntryCard
              key={sale.id}
              sale={sale}
              customer={customer}
              onEdit={onEdit ? () => onEdit(sale) : undefined}
              onDelete={onDelete ? () => onDelete(sale) : undefined}
            />
          );
        })}
        
        {/* Intersection observer trigger at the bottom */}
        {hasMore && <div ref={observerRef} className="h-4" />}
      </div>

      {/* Status footer outside scroll area */}
      <div className="pt-3 border-t border-border/50 mt-2">
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
      </div>
    </div>
  );
}
