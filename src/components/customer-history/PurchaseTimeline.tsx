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
 * - Button pagination (instead of infinite scroll)
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { EntryCard } from "@/components/shared/EntryCard";
import type { Sale, Customer } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 date groups per page

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

  // Pagination calculations
  const totalPages = Math.ceil(dateGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroups = dateGroups.slice(startIndex, endIndex);

  // Reset to page 1 when customer changes
  useMemo(() => {
    setCurrentPage(1);
  }, [customer.id]);

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
      {paginatedGroups.map((group) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              <PaginationItem>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages} ({dateGroups.length} dates total)
                </span>
              </PaginationItem>
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
