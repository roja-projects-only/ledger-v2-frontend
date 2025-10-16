/**
 * Dashboard Page - Business analytics and performance overview
 * 
 * Features:
 * - Summary KPI cards with sparklines and month-over-month comparisons
 * - Revenue overview chart with multiple time periods
 * - Top locations by revenue
 * - Sales distribution by location (donut chart)
 * - Top customers this month
 */

import { Container } from "@/components/layout/Container";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { getSemanticColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

// ============================================================================
// Dashboard Page Component
// ============================================================================

export function Dashboard() {
  const { data, loading, error } = useDashboardData();

  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Business overview and analytics
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                errorTone.bg,
                errorTone.border,
                errorTone.text,
              )}
            >
              <p className="font-medium">Unable to load dashboard data.</p>
              <p className={cn("text-xs", errorTone.subtext)}>
                {error}. Please check your connection and try again.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-6">
              {/* Summary Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card border rounded-lg p-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="bg-card border rounded-lg p-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>

              {/* Analytics Grid Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-lg p-6">
                  <Skeleton className="h-4 w-48 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
                <div className="bg-card border rounded-lg p-6">
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-[200px] w-full" />
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && data && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    ₱{data.thisMonth.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm mt-1 text-emerald-500">
                    {data.growth.revenue > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(data.growth.revenue).toFixed(1)}% vs last month
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Gallons Sold
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {data.thisMonth.quantity.toLocaleString()}
                  </p>
                  <p className="text-sm mt-1 text-sky-500">
                    {data.growth.quantity > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(data.growth.quantity).toFixed(1)}% vs last month
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Avg Sale Value
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    ₱{data.thisMonth.averageSale.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1 text-amber-500">
                    {data.growth.averageSale > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(data.growth.averageSale).toFixed(1)}% vs last month
                  </p>
                </div>

                <div className="bg-card border rounded-lg p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Active Customers
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {data.thisMonth.activeCustomers}
                  </p>
                  <p className="text-sm mt-1 text-purple-500">
                    {data.growth.activeCustomers > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(data.growth.activeCustomers).toFixed(1)}% vs last month
                  </p>
                </div>
              </div>

              {/* Placeholder for future components */}
              <div className="bg-card border rounded-lg p-6">
                <p className="text-sm text-muted-foreground">
                  Revenue overview chart and analytics coming in Phase 2-4...
                </p>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
