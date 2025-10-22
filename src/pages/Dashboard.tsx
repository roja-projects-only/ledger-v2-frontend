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

import { useMemo, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueOverviewChart } from "@/components/dashboard/RevenueOverviewChart";
import { TopLocationsCard } from "@/components/dashboard/TopLocationsCard";
import { SalesDistributionChart } from "@/components/dashboard/SalesDistributionChart";
import { TopCustomersCard } from "@/components/dashboard/TopCustomersCard";
import { DateFilterControls } from "@/components/dashboard/DateFilterControls";
import { useDashboardData } from "@/lib/hooks/useDashboardData";
import { useDateFilter } from "@/lib/hooks/useDateFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency } from "@/lib/utils";
import { DollarSign, Droplet, TrendingUp, Users, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DateFilterProvider } from "@/lib/contexts/DateFilterContext";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";

// ============================================================================
// Dashboard Page Component
// ============================================================================

function DashboardContent() {
  const { data, loading, error } = useDashboardData();
  const { computed, preset } = useDateFilter();
  const navigate = useNavigate();

  // Fetch payment summary for collection trends
  const { data: paymentSummary } = useQuery({
    queryKey: queryKeys.payments.summary(),
    queryFn: paymentsApi.getPaymentSummary,
  });

  // Memoize navigation callbacks for performance
  const handleViewAllLocations = useCallback(() => {
    navigate("/analysis");
  }, [navigate]);

  const handleCustomerClick = useCallback((customerId: string) => {
    navigate(`/customers?id=${customerId}`);
  }, [navigate]);

  // Get chart data based on selected preset
  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Map preset to corresponding chart data
    const dataMap = {
      "7D": data.chartData7D,
      "30D": data.chartData30D,
      "90D": data.chartData90D,
      "1Y": data.chartData1Y,
    };
    
    return dataMap[preset] || data.chartData30D;
  }, [data, preset]);

  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Business overview and analytics
            </p>
          </header>

          {/* Date Filter Controls */}
          <DateFilterControls />

          {/* Error State */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
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
            <div className="space-y-6" role="status" aria-label="Loading dashboard data" aria-live="polite">
              <span className="sr-only">Loading dashboard data, please wait...</span>
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
            <main 
              id="main-content" 
              className="space-y-6 animate-in fade-in duration-300"
            >
              {/* Summary Stats */}
              <section aria-labelledby="kpi-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
                {/* Total Revenue */}
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(data.thisMonth.revenue)}
                  icon={DollarSign}
                  variant="revenue"
                  trend={{
                    direction: data.trends.revenue,
                    percentage: data.growth.revenue,
                    label: computed.comparisonLabel,
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
                    label: computed.comparisonLabel,
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
                    label: computed.comparisonLabel,
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
                    label: computed.comparisonLabel,
                  }}
                  sparklineData={data.sparklineData}
                />
              </section>

              {/* Payment Collection Trends */}
              {paymentSummary && (
                <section aria-labelledby="payment-trends-heading">
                  <h2 id="payment-trends-heading" className="sr-only">Payment Collection Trends</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payment Collection Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Outstanding</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(paymentSummary.totalOutstanding)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {paymentSummary.customersWithDebt} customers
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Overdue Amount</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(paymentSummary.totalOverdue)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {paymentSummary.overdueCustomers} customers
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Collected Today</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(paymentSummary.totalPaymentsToday)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {paymentSummary.paymentsReceivedToday} payments
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Avg Debt Age</p>
                          <p className="text-2xl font-bold">
                            {paymentSummary.averageDebtAge} days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Average across all debt
                          </p>
                        </div>
                      </div>
                      {paymentSummary.overdueCustomers > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                              {paymentSummary.overdueCustomers} customer{paymentSummary.overdueCustomers > 1 ? 's have' : ' has'} overdue payments
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              Consider sending payment reminders to improve collection rates
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Revenue Overview Chart */}
              <section aria-labelledby="revenue-chart-heading">
                <h2 id="revenue-chart-heading" className="sr-only">Revenue Trend Analysis</h2>
                <RevenueOverviewChart 
                  data={chartData}
                  loading={loading} 
                />
              </section>

              {/* Location & Customer Analytics Grid */}
              <section aria-labelledby="analytics-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <h2 id="analytics-heading" className="sr-only">Location and Sales Analytics</h2>
                
                {/* Top Locations */}
                <TopLocationsCard
                  locations={data.topLocations}
                  loading={loading}
                  onViewAll={handleViewAllLocations}
                />

                {/* Sales Distribution */}
                <SalesDistributionChart
                  locations={data.allLocations}
                  totalRevenue={data.thisMonth.revenue}
                  loading={loading}
                />
              </section>

              {/* Top Customers - Full Width */}
              <section aria-labelledby="customers-heading">
                <h2 id="customers-heading" className="sr-only">Top Performing Customers</h2>
                <TopCustomersCard
                  customers={data.topCustomers}
                  loading={loading}
                  onCustomerClick={handleCustomerClick}
                />
              </section>
            </main>
          )}
        </div>
      </Container>
    </div>
  );
}

// ============================================================================
// Wrapped Component with Context Provider
// ============================================================================

export function Dashboard() {
  return (
    <DateFilterProvider>
      <DashboardContent />
    </DateFilterProvider>
  );
}
