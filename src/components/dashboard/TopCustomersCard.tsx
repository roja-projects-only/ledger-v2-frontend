/**
 * TopCustomersCard Component
 * 
 * ⚠️ PRICING: Receives pre-calculated revenue from useDashboardData
 * - Revenue already respects enableCustomPricing toggle
 * - Data calculated via analytics utilities with getEffectivePriceFromData()
 * - See: src/lib/hooks/useDashboardData.ts and docs/PRICING_GUIDE.md
 * 
 * Displays top 10 customers by revenue with clickable rows.
 * 
 * Features:
 * - Sortable table with rank, name, location, revenue
 * - Clickable rows for customer details navigation
 * - Location color indicators
 * - Empty state handling
 * - Loading skeleton support
 */

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Users, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerStats } from "@/lib/utils/analytics";

// ============================================================================
// Types
// ============================================================================

export interface TopCustomersCardProps {
  /** Top customer statistics (pre-sorted, top 10) */
  customers: CustomerStats[];
  /** Optional loading state */
  loading?: boolean;
  /** Optional callback when customer row clicked */
  onCustomerClick?: (customerId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TopCustomersCard({
  customers,
  loading = false,
  onCustomerClick,
}: TopCustomersCardProps) {
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="mb-6">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          Top Customers
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Highest revenue contributors this month
        </p>
      </div>

      {/* Customer Table */}
      {customers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No customer data available
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Table Header - Hidden on mobile */}
          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-slate-700">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Customer</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-3 text-right">Revenue</div>
          </div>

          {/* Table Rows */}
          {customers.map((customer, index) => {
            const formattedLocation = customer.location
              .split("_")
              .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
              .join(" ");

            return (
              <button
                key={customer.customerId}
                onClick={() => onCustomerClick?.(customer.customerId)}
                className={cn(
                  "w-full grid grid-cols-12 gap-2 sm:gap-3 px-3 py-2.5 rounded-lg",
                  "text-left text-sm transition-colors",
                  "hover:bg-slate-800/50",
                  onCustomerClick && "cursor-pointer group",
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      index < 3 ? "text-amber-400" : "text-slate-400",
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Customer Name */}
                <div className="col-span-7 sm:col-span-5 flex items-center min-w-0">
                  <span className="font-medium truncate group-hover:text-sky-400 transition-colors">
                    {customer.customerName}
                  </span>
                </div>

                {/* Location - Hidden on mobile */}
                <div className="hidden sm:flex col-span-3 items-center text-slate-400 text-xs">
                  {formattedLocation}
                </div>

                {/* Revenue */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2">
                  <span className="font-semibold tabular-nums text-xs sm:text-sm">
                    {formatCurrency(customer.revenue)}
                  </span>
                  {onCustomerClick && (
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
