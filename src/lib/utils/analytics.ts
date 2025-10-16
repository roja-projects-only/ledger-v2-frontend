/**
 * Analytics Utility Functions
 * 
 * Data aggregation and calculation functions for dashboard metrics.
 */

import type { Sale, Customer, Location } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

export interface PeriodMetrics {
  revenue: number;
  quantity: number;
  averageSale: number;
  activeCustomers: number;
  transactionCount: number;
}

export interface DailyMetric {
  date: string;
  revenue: number;
  quantity: number;
  transactionCount: number;
}

export interface LocationStats {
  location: Location;
  revenue: number;
  quantity: number;
  transactionCount: number;
  percentage: number;
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  location: Location;
  revenue: number;
  quantity: number;
  transactionCount: number;
}

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Get start of current month
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get start of last month
 */
export function getStartOfLastMonth(date: Date = new Date()): Date {
  const lastMonth = new Date(date);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
}

/**
 * Get end of last month
 */
export function getEndOfLastMonth(date: Date = new Date()): Date {
  const startOfThisMonth = getStartOfMonth(date);
  const endOfLastMonth = new Date(startOfThisMonth);
  endOfLastMonth.setDate(endOfLastMonth.getDate() - 1);
  return endOfLastMonth;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// Period Calculations
// ============================================================================

/**
 * Calculate metrics for a specific time period
 */
export function calculatePeriodMetrics(
  sales: Sale[],
  _customers: Customer[],
  startDate: Date,
  endDate: Date
): PeriodMetrics {
  const startISO = formatDateToISO(startDate);
  const endISO = formatDateToISO(endDate);

  // Filter sales within period
  const periodSales = sales.filter((sale) => {
    const saleDate = sale.date.split('T')[0];
    return saleDate >= startISO && saleDate <= endISO;
  });

  // Calculate totals
  const revenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);
  const quantity = periodSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const transactionCount = periodSales.length;

  // Calculate average sale
  const averageSale = transactionCount > 0 ? revenue / transactionCount : 0;

  // Calculate active customers (unique customer IDs)
  const uniqueCustomerIds = new Set(periodSales.map((sale) => sale.customerId));
  const activeCustomers = uniqueCustomerIds.size;

  return {
    revenue,
    quantity,
    averageSale,
    activeCustomers,
    transactionCount,
  };
}

/**
 * Calculate growth percentage between current and previous values
 */
export function calculateGrowthPercentage(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend direction based on growth percentage
 */
export function getTrendDirection(
  growthPercentage: number
): "up" | "down" | "neutral" {
  if (growthPercentage > 0) return "up";
  if (growthPercentage < 0) return "down";
  return "neutral";
}

// ============================================================================
// Time Series Data
// ============================================================================

/**
 * Get daily metrics for the last N days
 */
export function getLastNDaysData(
  sales: Sale[],
  days: number
): DailyMetric[] {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  const dailyData: Map<string, DailyMetric> = new Map();

  // Initialize all dates with zero values
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateISO = formatDateToISO(date);
    dailyData.set(dateISO, {
      date: dateISO,
      revenue: 0,
      quantity: 0,
      transactionCount: 0,
    });
  }

  // Aggregate sales by date
  sales.forEach((sale) => {
    const saleDate = sale.date.split('T')[0];
    const existing = dailyData.get(saleDate);
    if (existing) {
      existing.revenue += sale.total;
      existing.quantity += sale.quantity;
      existing.transactionCount += 1;
    }
  });

  // Convert to array and sort by date
  return Array.from(dailyData.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get last 7 days data for sparklines
 */
export function getLast7DaysData(sales: Sale[]): DailyMetric[] {
  return getLastNDaysData(sales, 7);
}

/**
 * Get last 30 days data for main chart
 */
export function getLast30DaysData(sales: Sale[]): DailyMetric[] {
  return getLastNDaysData(sales, 30);
}

/**
 * Get last 90 days data (may need weekly aggregation)
 */
export function getLast90DaysData(sales: Sale[]): DailyMetric[] {
  return getLastNDaysData(sales, 90);
}

/**
 * Get last year data (may need monthly aggregation)
 */
export function getLastYearData(sales: Sale[]): DailyMetric[] {
  return getLastNDaysData(sales, 365);
}

// ============================================================================
// Location Analytics
// ============================================================================

/**
 * Aggregate sales by location
 */
export function aggregateSalesByLocation(
  sales: Sale[],
  customers: Customer[]
): LocationStats[] {
  const locationMap = new Map<Location, Omit<LocationStats, 'location' | 'percentage'>>();

  // Create customer lookup
  const customerLookup = new Map(customers.map((c) => [c.id, c]));

  // Aggregate by location
  sales.forEach((sale) => {
    const customer = customerLookup.get(sale.customerId);
    if (!customer) return;

    const location = customer.location;
    const existing = locationMap.get(location);

    if (existing) {
      existing.revenue += sale.total;
      existing.quantity += sale.quantity;
      existing.transactionCount += 1;
    } else {
      locationMap.set(location, {
        revenue: sale.total,
        quantity: sale.quantity,
        transactionCount: 1,
      });
    }
  });

  // Calculate total revenue for percentages
  const totalRevenue = Array.from(locationMap.values()).reduce(
    (sum, stats) => sum + stats.revenue,
    0
  );

  // Convert to array with percentages
  const locationStats: LocationStats[] = Array.from(locationMap.entries()).map(
    ([location, stats]) => ({
      location,
      ...stats,
      percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
    })
  );

  // Sort by revenue descending
  return locationStats.sort((a, b) => b.revenue - a.revenue);
}

// ============================================================================
// Customer Analytics
// ============================================================================

/**
 * Rank customers by revenue
 */
export function rankCustomersByRevenue(
  sales: Sale[],
  customers: Customer[],
  limit: number = 10
): CustomerStats[] {
  const customerMap = new Map<string, Omit<CustomerStats, 'customerId' | 'customerName' | 'location'>>();

  // Aggregate by customer
  sales.forEach((sale) => {
    const existing = customerMap.get(sale.customerId);

    if (existing) {
      existing.revenue += sale.total;
      existing.quantity += sale.quantity;
      existing.transactionCount += 1;
    } else {
      customerMap.set(sale.customerId, {
        revenue: sale.total,
        quantity: sale.quantity,
        transactionCount: 1,
      });
    }
  });

  // Create customer lookup
  const customerLookup = new Map(customers.map((c) => [c.id, c]));

  // Convert to array with customer details
  const customerStats: CustomerStats[] = Array.from(customerMap.entries())
    .map(([customerId, stats]) => {
      const customer = customerLookup.get(customerId);
      return {
        customerId,
        customerName: customer?.name || 'Unknown',
        location: customer?.location || 'BANAI',
        ...stats,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return customerStats;
}
