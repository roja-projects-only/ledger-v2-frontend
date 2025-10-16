/**
 * PurchaseTimeline - Display customer's purchase history grouped by date
 * 
 * Features:
 * - Groups sales by date (most recent first)
 * - Each date section shows:
 *   - Date header
 *   - List of entry cards for that date
 *   - Day total
 * - Responsive design
 * - Infinite scroll pagination
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/shared/EntryCard";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import type { Sale, Customer } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, Loader2 } from "lucide-react";
import { usePricing } from "@/lib/hooks/usePricing";

// ============================================================================
// Types
// ============================================================================

interface PurchaseTimelineProps {
  sales: Sale[];
  customer: Customer;
  onDelete?: (sale: Sale) => void;
}

interface DateGroup {
  date: string; // ISO date string
  displayDate: string; // Formatted date
  sales: Sale[];
  total: number;
}

// ============================================================================
// Component
// ============================================================================

export function PurchaseTimeline({
  sales,
  customer,
  onDelete,
}: PurchaseTimelineProps) {
  const { getEffectivePrice } = usePricing();

  // Group sales by date
  const dateGroups = useMemo(() => {
    const groups = new Map<string, Sale[]>();

    sales.forEach((sale) => {
      const existing = groups.get(sale.date) || [];
      groups.set(sale.date, [...existing, sale]);
    });

    // Convert to array and sort descending (most recent first)
    const result: DateGroup[] = [];
    groups.forEach((dateSales, date) => {
      // Calculate total with effective pricing
      const effectivePrice = getEffectivePrice(customer);
      const total = dateSales.reduce((sum, sale) => sum + sale.quantity * effectivePrice, 0);
      result.push({
        date,
        displayDate: formatDate(date),
        sales: dateSales.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        total,
      });
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, customer, getEffectivePrice]);

  // Infinite scroll for date groups (5 date groups per load on mobile, 10 on desktop)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const {
    displayedItems: displayedGroups,
    hasMore,
    loadMore,
    observerRef,
    totalItems,
    displayedCount,
  } = useInfiniteScroll(dateGroups, { 
    itemsPerPage: isMobile ? 5 : 10,
    autoLoad: true 
  });

  if (dateGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No purchase history</p>
            <p className="text-sm mt-1">
              This customer hasn't made any purchases yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date groups */}
      {displayedGroups.map((group) => (
        <Card key={group.date}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {group.displayDate}
              </CardTitle>
              <div className="text-lg font-semibold text-primary">
                {formatCurrency(group.total)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.sales.map((sale) => (
                <EntryCard
                  key={sale.id}
                  sale={sale}
                  customer={customer}
                  onDelete={onDelete ? () => onDelete(sale) : undefined}
                />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {group.sales.length} {group.sales.length === 1 ? "entry" : "entries"}
              </span>
              <span className="font-medium">
                Day Total: {formatCurrency(group.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load more section */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3">
          {/* Intersection observer trigger */}
          <div ref={observerRef} className="h-1" />
          
          {/* Load More button */}
          <Button
            onClick={loadMore}
            variant="outline"
            className="w-full max-w-md"
            size="sm"
          >
            <Loader2 className="h-4 w-4 mr-2 animate-spin opacity-50" />
            Load More Dates ({displayedCount} of {totalItems})
          </Button>
        </div>
      )}

      {/* All loaded message */}
      {!hasMore && totalItems > (isMobile ? 5 : 10) && (
        <p className="text-center text-sm text-muted-foreground">
          Showing all {totalItems} dates
        </p>
      )}
    </div>
  );
}
