/**
 * Chart Helper Utilities
 * 
 * Functions for formatting chart data and styling.
 */

import type { DailyMetric } from "./analytics";

// ============================================================================
// Chart Data Formatting
// ============================================================================

/**
 * Format chart data for Recharts
 */
export interface ChartDataPoint {
  date: string;
  displayDate: string;
  value: number; // Primary value for charts (usually revenue)
  revenue: number;
  quantity: number;
}

/**
 * Transform daily metrics to chart-ready format
 */
export function formatChartData(
  dailyData: DailyMetric[],
  period: "7D" | "30D" | "90D" | "1Y"
): ChartDataPoint[] {
  return dailyData.map((day) => ({
    date: day.date,
    displayDate: formatDateAxis(day.date, period),
    value: day.revenue, // Primary value for area/line charts
    revenue: day.revenue,
    quantity: day.quantity,
  }));
}

// ============================================================================
// Axis Formatting
// ============================================================================

/**
 * Format currency values for Y-axis
 * Examples: ₱1k, ₱10k, ₱100k, ₱1M
 */
export function formatCurrencyAxis(value: number): string {
  if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₱${(value / 1000).toFixed(0)}k`;
  }
  return `₱${value}`;
}

/**
 * Format date for X-axis based on period
 */
export function formatDateAxis(
  dateString: string,
  period: "7D" | "30D" | "90D" | "1Y"
): string {
  const date = new Date(dateString);
  
  switch (period) {
    case "7D":
    case "30D":
      // Short format: "Oct 1"
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    case "90D":
      // Medium format: "10/01"
      return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
    
    case "1Y":
      // Month only: "Jan"
      return date.toLocaleDateString("en-US", { month: "short" });
    
    default:
      return dateString;
  }
}

// ============================================================================
// Chart Colors
// ============================================================================

/**
 * Get chart color palette from CSS variables
 */
export function getChartColors() {
  return {
    revenue: "rgb(14, 165, 233)", // sky-500
    volume: "rgb(16, 185, 129)", // emerald-500
    average: "rgb(245, 158, 11)", // amber-500
    customers: "rgb(168, 85, 247)", // purple-500
    grid: "rgb(51, 65, 85)", // slate-700
    axis: "rgb(148, 163, 184)", // slate-400
  };
}

/**
 * Create gradient ID for area chart fill
 */
export function getGradientId(name: string): string {
  return `${name}Gradient`;
}
