/**
 * useKPIs - Custom hook for calculating key performance indicators
 * 
 * Features:
 * - Calculate KPIs from sales data with toggle-aware pricing
 * - Today's KPIs, date range KPIs, customer KPIs
 * - Location-based aggregations
 * - Recalculates totals using effective prices based on toggle state
 */

import { useMemo } from "react";
import { DollarSign, Package, Users, TrendingUp, Receipt } from "lucide-react";
import type { Sale, Customer, KPI } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { usePricing } from "./usePricing";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total sales amount using effective prices (respects toggle state)
 */
function calculateTotalSales(
  sales: Sale[], 
  customers: Customer[], 
  getEffectivePrice: (customer?: Customer) => number
): number {
  return sales.reduce((sum, sale) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const effectivePrice = getEffectivePrice(customer);
    return sum + (sale.quantity * effectivePrice);
  }, 0);
}

/**
 * Calculate total containers sold
 */
function calculateTotalContainers(sales: Sale[]): number {
  return sales.reduce((sum, sale) => sum + sale.quantity, 0);
}

// ============================================================================
// Hook
// ============================================================================

export function useKPIs(sales: Sale[], customers: Customer[]) {
  const { getEffectivePrice } = usePricing();

  /**
   * Get today's KPIs
   */
  const todayKPIs = useMemo((): KPI[] => {
    const today = getTodayISO();
    // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
    const todaySales = sales.filter((s) => s.date.split('T')[0] === today);
    const totalSales = calculateTotalSales(todaySales, customers, getEffectivePrice);
    const totalContainers = calculateTotalContainers(todaySales);
    const uniqueCustomers = new Set(todaySales.map((s) => s.customerId)).size;
    const averageSale = todaySales.length > 0 ? totalSales / todaySales.length : 0;

    return [
      {
        label: "Total Sales Today",
        value: totalSales,
        icon: DollarSign,
        variant: "revenue",
      },
      {
        label: "Containers Sold Today",
        value: totalContainers,
        icon: Package,
        variant: "quantity",
      },
      {
        label: "Customers Served",
        value: uniqueCustomers,
        icon: Users,
        variant: "customers",
      },
      {
        label: "Average Sale",
        value: averageSale,
        icon: TrendingUp,
        variant: "average",
      },
    ];
  }, [sales, customers, getEffectivePrice]);

  /**
   * Get KPIs for a date range
   */
  const getDateRangeKPIs = useMemo(
    () => (startDate: string, endDate: string): KPI[] => {
      // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
      const rangeSales = sales.filter((s) => {
        const saleDate = s.date.split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
      });

      const uniqueCustomers = new Set(rangeSales.map((s) => s.customerId)).size;
      const totalSales = calculateTotalSales(rangeSales, customers, getEffectivePrice);
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );
      const avgDailySales = totalSales / days;

      return [
        {
          label: "Total Sales",
          value: totalSales,
          icon: DollarSign,
          variant: "revenue",
        },
        {
          label: "Total Customers",
          value: uniqueCustomers,
          icon: Users,
          variant: "customers",
        },
        {
          label: "Avg Daily Sales",
          value: avgDailySales,
          icon: TrendingUp,
          variant: "average",
        },
      ];
    },
    [sales, customers, getEffectivePrice]
  );

  /**
   * Get KPIs for a specific customer
   */
  const getCustomerKPIs = useMemo(
    () => (customerId: string): KPI[] => {
      const customerSales = sales.filter((s) => s.customerId === customerId);

      return [
        {
          label: "Total Sales",
          value: calculateTotalSales(customerSales, customers, getEffectivePrice),
          icon: DollarSign,
          variant: "revenue",
        },
        {
          label: "Total Containers",
          value: calculateTotalContainers(customerSales),
          icon: Package,
          variant: "quantity",
        },
        {
          label: "Total Entries",
          value: customerSales.length,
          icon: Receipt,
          variant: "customers", // Amber color for entries count
        },
        {
          label: "Average per Entry",
          value:
            customerSales.length > 0
              ? calculateTotalSales(customerSales, customers, getEffectivePrice) / customerSales.length
              : 0,
          icon: TrendingUp,
          variant: "average",
        },
      ];
    },
    [sales, customers, getEffectivePrice]
  );

  /**
   * Aggregate sales by location (using effective prices)
   */
  const salesByLocation = useMemo(() => {
    const locationMap = sales.reduce((acc, sale) => {
      const customer = customers.find((c) => c.id === sale.customerId);
      if (customer) {
        if (!acc[customer.location]) {
          acc[customer.location] = {
            location: customer.location,
            total: 0,
            containers: 0,
            entries: 0,
          };
        }
        const effectivePrice = getEffectivePrice(customer);
        const saleTotal = sale.quantity * effectivePrice;
        acc[customer.location].total += saleTotal;
        acc[customer.location].containers += sale.quantity;
        acc[customer.location].entries += 1;
      }
      return acc;
    }, {} as Record<string, { location: string; total: number; containers: number; entries: number }>);

    return Object.values(locationMap).sort((a, b) => b.total - a.total);
  }, [sales, customers, getEffectivePrice]);

  return {
    todayKPIs,
    getDateRangeKPIs,
    getCustomerKPIs,
    salesByLocation,
  };
}
