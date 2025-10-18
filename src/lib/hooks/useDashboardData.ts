/**
 * useDashboardData - Custom hook for dashboard metrics
 * 
 * Aggregates sales and customer data for dashboard display.
 * Now supports date filtering via DateFilterContext.
 */

import { useMemo } from "react";
import { useSales } from "./useSales";
import { useCustomers } from "./useCustomers";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { useDateFilter } from "./useDateFilter";
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
  filterSalesByDateRange,
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
  const { settings } = useSettings();
  const { computed: dateFilter, comparisonEnabled } = useDateFilter();

  const loading = salesLoading || customersLoading;
  const error = salesError || customersError;

  const data = useMemo<DashboardData | null>(() => {
    if (loading || !sales.length || !customers.length) {
      return null;
    }

    // Get custom pricing setting and global unit price
    const customPricingEnabled = settings.enableCustomPricing ?? true;
    const globalUnitPrice = settings.unitPrice || 0;

    // Use date filter ranges
    const { startDate, endDate, comparisonStartDate, comparisonEndDate } = dateFilter;

    // Filter sales by selected date range
    const filteredSales = filterSalesByDateRange(sales, startDate, endDate);

    // Calculate period metrics for selected range
    const thisPeriod = calculatePeriodMetrics(
      sales,
      customers,
      startDate,
      endDate,
      customPricingEnabled,
      globalUnitPrice
    );

    // Calculate comparison period metrics
    const comparisonPeriod = calculatePeriodMetrics(
      sales,
      customers,
      comparisonStartDate,
      comparisonEndDate,
      customPricingEnabled,
      globalUnitPrice
    );

    // Calculate growth percentages
    const revenueGrowth = calculateGrowthPercentage(
      thisPeriod.revenue,
      comparisonPeriod.revenue
    );
    const quantityGrowth = calculateGrowthPercentage(
      thisPeriod.quantity,
      comparisonPeriod.quantity
    );
    const averageSaleGrowth = calculateGrowthPercentage(
      thisPeriod.averageSale,
      comparisonPeriod.averageSale
    );
    const activeCustomersGrowth = calculateGrowthPercentage(
      thisPeriod.activeCustomers,
      comparisonPeriod.activeCustomers
    );

    // Get trend directions
    const revenueTrend = getTrendDirection(revenueGrowth);
    const quantityTrend = getTrendDirection(quantityGrowth);
    const averageSaleTrend = getTrendDirection(averageSaleGrowth);
    const activeCustomersTrend = getTrendDirection(activeCustomersGrowth);

    // Get time series data for selected range
    // For sparkline, use last 7 days of the selected range
    const sparklineStartDate = new Date(endDate);
    sparklineStartDate.setDate(sparklineStartDate.getDate() - 6);
    const sparklineData = getLast7DaysData(
      filteredSales, 
      customers, 
      customPricingEnabled, 
      globalUnitPrice,
      sparklineStartDate,
      endDate
    );

    // Chart data uses the full selected range
    const chartData7D = formatChartData(
      getLast7DaysData(filteredSales, customers, customPricingEnabled, globalUnitPrice, startDate, endDate), 
      "7D"
    );
    const chartData30D = formatChartData(
      getLast30DaysData(filteredSales, customers, customPricingEnabled, globalUnitPrice, startDate, endDate), 
      "30D"
    );
    const chartData90D = formatChartData(
      getLast90DaysData(filteredSales, customers, customPricingEnabled, globalUnitPrice, startDate, endDate), 
      "90D"
    );
    const chartData1Y = formatChartData(
      getLastYearData(filteredSales, customers, customPricingEnabled, globalUnitPrice, startDate, endDate), 
      "1Y"
    );

    // Get location analytics for filtered sales
    const allLocations = aggregateSalesByLocation(filteredSales, customers, customPricingEnabled, globalUnitPrice);
    const topLocations = allLocations.slice(0, 5);

    // Get customer analytics for filtered sales
    const topCustomers = rankCustomersByRevenue(filteredSales, customers, 10, customPricingEnabled, globalUnitPrice);

    return {
      thisMonth: thisPeriod,
      lastMonth: comparisonPeriod,
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
  }, [sales, customers, settings.enableCustomPricing, settings.unitPrice, dateFilter, comparisonEnabled, loading]);

  return { data, loading, error };
}
