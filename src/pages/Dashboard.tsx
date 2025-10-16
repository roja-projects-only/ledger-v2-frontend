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
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueOverviewChart } from "@/components/dashboard/RevenueOverviewChart";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency } from "@/lib/utils";
import { DollarSign, Droplet, TrendingUp, Users } from "lucide-react";

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
                  <StatCard
                    key={i}
                    label="Loading"
                    value={0}
                    icon={DollarSign}
                    variant="revenue"
                    trend={{ direction: "neutral", percentage: 0, label: "vs last month" }}
                    sparklineData={[]}
                    loading={true}
                  />
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
                {/* Total Revenue */}
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(data.thisMonth.revenue)}
                  icon={DollarSign}
                  variant="revenue"
                  trend={{
                    direction: data.trends.revenue,
                    percentage: data.growth.revenue,
                    label: "vs last month",
                  }}
                  sparklineData={data.sparklineData}
                />

                {/* Gallons Sold */}
                <StatCard
                  label="Gallons Sold"
                  value={data.thisMonth.quantity.toLocaleString()}
                  icon={Droplet}
                  variant="quantity"
                  trend={{
                    direction: data.trends.quantity,
                    percentage: data.growth.quantity,
                    label: "vs last month",
                  }}
                  sparklineData={data.sparklineData}
                />

                {/* Avg Sale Value */}
                <StatCard
                  label="Avg Sale Value"
                  value={formatCurrency(data.thisMonth.averageSale)}
                  icon={TrendingUp}
                  variant="average"
                  trend={{
                    direction: data.trends.averageSale,
                    percentage: data.growth.averageSale,
                    label: "vs last month",
                  }}
                  sparklineData={data.sparklineData}
                />

                {/* Active Customers */}
                <StatCard
                  label="Active Customers"
                  value={data.thisMonth.activeCustomers.toString()}
                  icon={Users}
                  variant="customers"
                  trend={{
                    direction: data.trends.activeCustomers,
                    percentage: data.growth.activeCustomers,
                    label: "vs last month",
                  }}
                  sparklineData={data.sparklineData}
                />
              </div>

              {/* Revenue Overview Chart */}
              <RevenueOverviewChart 
                data={{
                  "7D": data.chartData7D,
                  "30D": data.chartData30D,
                  "90D": data.chartData90D,
                  "1Y": data.chartData1Y,
                }}
                loading={loading} 
              />

              {/* Placeholder for Phase 4 analytics */}
              <div className="bg-card border rounded-lg p-6">
                <p className="text-sm text-muted-foreground">
                  Location and customer analytics coming in Phase 4...
                </p>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
