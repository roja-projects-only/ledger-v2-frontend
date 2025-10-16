/**
 * PurchaseTimeline - Display customer's purchase history as flat list
 * 
 * Features:
 * - Simple flat list of sales (one sale per date per customer)
 * - Sorted by date (most recent first)
 * - Compact single-line rows
 * - Virtual scrolling for large datasets
 * - Pagination for smaller lists
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { SaleRow } from "@/components/customer-history/SaleRow";
import { VirtualList } from "@/components/shared/VirtualList";
import type { Sale, Customer } from "@/lib/types";
import { Calendar } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface PurchaseTimelineProps {
  sales: Sale[];
  customer: Customer;
  onDelete?: (sale: Sale) => void;
}

// ============================================================================
// Component
// ============================================================================

export function PurchaseTimeline({
  sales,
  customer,
  onDelete,
}: PurchaseTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Show 15 sales per page

  // Sort sales by date (most recent first)
  const sortedSales = useMemo(() => {
    return [...sales].sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);

  // Use virtual scrolling for large lists (50+ sales)
  const useVirtualScrolling = sortedSales.length >= 50;

  // Pagination calculations (only used for small lists)
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = sortedSales.slice(startIndex, endIndex);

  // Reset to page 1 when customer changes
  useMemo(() => {
    setCurrentPage(1);
  }, [customer.id]);

  // Empty state
  if (sortedSales.length === 0) {
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

  // Render a single sale row
  const renderSaleRow = (sale: Sale) => (
    <SaleRow
      key={sale.id}
      sale={sale}
      customer={customer}
      onDelete={onDelete ? () => onDelete(sale) : undefined}
    />
  );

  // Use virtual scrolling for large lists (50+ sales)
  if (useVirtualScrolling) {
    return (
      <Card className="overflow-hidden">
        <VirtualList
          items={sortedSales}
          estimateSize={40} // Estimated height of each sale row
          renderItem={(sale) => renderSaleRow(sale)}
          className="h-[600px]"
          overscan={5}
        />
      </Card>
    );
  }

  // Use pagination for smaller lists (< 50 sales)
  return (
    <div className="space-y-4">
      {/* Sales List */}
      <Card className="overflow-hidden">
        <div className="divide-y">
          {paginatedSales.map((sale) => renderSaleRow(sale))}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
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
                Page {currentPage} of {totalPages} ({sortedSales.length} sales total)
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
      )}
    </div>
  );
}
