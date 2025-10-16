/**
 * CustomerPerformanceChart - Horizontal bar chart showing top customers by sales
 * 
 * Features:
 * - Recharts horizontal BarChart
 * - Shows top 10 customers by total sales
 * - Sorted descending by sales amount
 * - Loading and empty states via ChartWrapper
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartWrapper } from "@/components/shared/ChartWrapper";
import type { Sale, Customer, Location } from "@/lib/types";
import { getLocationColor } from "@/lib/colors";
import { formatCurrency, capitalize } from "@/lib/utils";
import { usePricing } from "@/lib/hooks/usePricing";

// ============================================================================
// Types
// ============================================================================

interface CustomerPerformanceChartProps {
  sales: Sale[];
  customers: Customer[];
  loading?: boolean;
}

interface CustomerData {
  customerId: string;
  customerName: string;
  total: number;
  location: Location;
  color: string;
}

const formatLocationLabel = (location: Location) =>
  location
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => capitalize(word))
    .join(" ");

const renderTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CustomerData }>;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const dataPoint = payload[0].payload;
  const colors = getLocationColor(dataPoint.location);

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-sm">
      <p className="text-sm font-semibold text-popover-foreground">{dataPoint.customerName}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: colors.hex }}
          aria-hidden
        />
        <span>{formatLocationLabel(dataPoint.location)}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Total Sales: <span className="font-medium text-popover-foreground">{formatCurrency(dataPoint.total)}</span>
      </p>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

export function CustomerPerformanceChart({
  sales,
  customers,
  loading = false,
}: CustomerPerformanceChartProps) {
  const { getEffectivePrice } = usePricing();

  // Aggregate sales by customer with effective pricing
  const customerSales = new Map<string, number>();

  sales.forEach((sale) => {
    const customer = customers.find((c) => c.id === sale.customerId);
    const effectivePrice = customer ? getEffectivePrice(customer) : sale.unitPrice;
    const total = sale.quantity * effectivePrice;
    const current = customerSales.get(sale.customerId) || 0;
    customerSales.set(sale.customerId, current + total);
  });

  // Convert to array with customer names
  const customerData: CustomerData[] = [];
  customerSales.forEach((total, customerId) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      const palette = getLocationColor(customer.location);
      customerData.push({
        customerId,
        customerName: customer.name,
        total,
        location: customer.location,
        color: palette.hex,
      });
    }
  });

  // Sort descending by total and take top 10 (or top 5 on mobile)
  customerData.sort((a, b) => b.total - a.total);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const topCustomers = customerData.slice(0, isMobile ? 5 : 10);

  const isEmpty = topCustomers.length === 0;
  const chartTitle = isMobile ? "Top 5 Customers" : "Top 10 Customers by Sales";

  return (
    <ChartWrapper
      title={chartTitle}
      loading={loading}
      empty={isEmpty}
      emptyMessage="No customer sales data available"
    >
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
        <BarChart
          data={topCustomers}
          layout="vertical"
          margin={
            isMobile
              ? { top: 5, right: 10, left: 5, bottom: 5 }
              : { top: 5, right: 30, left: 10, bottom: 5 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis
            type="number"
            tick={{ fontSize: isMobile ? 9 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
            tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
          />
          <YAxis
            type="category"
            dataKey="customerName"
            tick={{ fontSize: isMobile ? 9 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
            width={isMobile ? 70 : 120}
          />
          <Tooltip content={renderTooltip} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {topCustomers.map((entry) => (
              <Cell key={entry.customerId} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
