/**
 * useDashboardData - Custom hook for dashboard metrics
 * 
 * Aggregates sales and customer data for dashboard display.
 */

import { useMemo } from "react";
import { useSales } from "./useSales";
import { useCustomers } from "./useCustomers";
import {
  calculatePeriodMetrics,
  calculateGrowthPercentage,
  getTrendDirection,
  getLast7DaysData,
  getLast30DaysData,
  getLast90DaysData,
  getLastYearData,
  aggregateSalesByLocation,
  rankCustomersByRevenue,
  getStartOfMonth,
  getStartOfLastMonth,
  getEndOfLastMonth,
  type PeriodMetrics,
  type DailyMetric,
  type LocationStats,
  type CustomerStats,
} from "@/lib/utils/analytics";
import { formatChartData, type ChartDataPoint } from "@/lib/utils/chartHelpers";

// ============================================================================
// Types
// ============================================================================

export interface DashboardData {
  // Current period metrics
  thisMonth: PeriodMetrics;
  lastMonth: PeriodMetrics;
  
  // Growth comparisons
  growth: {
    revenue: number;
    quantity: number;
    averageSale: number;
    activeCustomers: number;
  };
  
  // Trend directions
  trends: {
    revenue: "up" | "down" | "neutral";
    quantity: "up" | "down" | "neutral";
    averageSale: "up" | "down" | "neutral";
    activeCustomers: "up" | "down" | "neutral";
  };
  
  // Time series data
  sparklineData: DailyMetric[]; // Last 7 days
  chartData7D: ChartDataPoint[];
  chartData30D: ChartDataPoint[];
  chartData90D: ChartDataPoint[];
  chartData1Y: ChartDataPoint[];
  
  // Analytics
  topLocations: LocationStats[];
  allLocations: LocationStats[];
  topCustomers: CustomerStats[];
}

// ============================================================================
// Hook
// ============================================================================

export function useDashboardData() {
  const { sales, loading: salesLoading, error: salesError } = useSales();
  const { customers, loading: customersLoading, error: customersError } = useCustomers();

  const loading = salesLoading || customersLoading;
  const error = salesError || customersError;

  const data = useMemo<DashboardData | null>(() => {
    if (loading || !sales.length || !customers.length) {
      return null;
    }

    // Calculate date ranges
    const now = new Date();
    const startOfThisMonth = getStartOfMonth(now);
    const startOfLastMonth = getStartOfLastMonth(now);
    const endOfLastMonth = getEndOfLastMonth(now);

    // Calculate period metrics
    const thisMonth = calculatePeriodMetrics(
      sales,
      customers,
      startOfThisMonth,
      now
    );

    const lastMonth = calculatePeriodMetrics(
      sales,
      customers,
      startOfLastMonth,
      endOfLastMonth
    );

    // Calculate growth percentages
    const revenueGrowth = calculateGrowthPercentage(
      thisMonth.revenue,
      lastMonth.revenue
    );
    const quantityGrowth = calculateGrowthPercentage(
      thisMonth.quantity,
      lastMonth.quantity
    );
    const averageSaleGrowth = calculateGrowthPercentage(
      thisMonth.averageSale,
      lastMonth.averageSale
    );
    const activeCustomersGrowth = calculateGrowthPercentage(
      thisMonth.activeCustomers,
      lastMonth.activeCustomers
    );

    // Get trend directions
    const revenueTrend = getTrendDirection(revenueGrowth);
    const quantityTrend = getTrendDirection(quantityGrowth);
    const averageSaleTrend = getTrendDirection(averageSaleGrowth);
    const activeCustomersTrend = getTrendDirection(activeCustomersGrowth);

    // Get time series data
    const sparklineData = getLast7DaysData(sales);
    const chartData7D = formatChartData(getLast7DaysData(sales), "7D");
    const chartData30D = formatChartData(getLast30DaysData(sales), "30D");
    const chartData90D = formatChartData(getLast90DaysData(sales), "90D");
    const chartData1Y = formatChartData(getLastYearData(sales), "1Y");

    // Get location analytics
    const allLocations = aggregateSalesByLocation(sales, customers);
    const topLocations = allLocations.slice(0, 5);

    // Get customer analytics
    const topCustomers = rankCustomersByRevenue(sales, customers, 10);

    return {
      thisMonth,
      lastMonth,
      growth: {
        revenue: revenueGrowth,
        quantity: quantityGrowth,
        averageSale: averageSaleGrowth,
        activeCustomers: activeCustomersGrowth,
      },
      trends: {
        revenue: revenueTrend,
        quantity: quantityTrend,
        averageSale: averageSaleTrend,
        activeCustomers: activeCustomersTrend,
      },
      sparklineData,
      chartData7D,
      chartData30D,
      chartData90D,
      chartData1Y,
      topLocations,
      allLocations,
      topCustomers,
    };
  }, [sales, customers, loading]);

  return { data, loading, error };
}
