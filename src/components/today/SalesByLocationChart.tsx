/**
 * SalesByLocationChart - Bar chart showing sales aggregated by location
 * 
 * Features:
 * - Horizontal bar chart using Recharts
 * - Sorted descending by sales amount
 * - Responsive container
 * - Loading and empty states
 */

import { ChartWrapper } from "@/components/shared/ChartWrapper";
import type { Sale, Customer, Location } from "@/lib/types";
import { getLocationColor } from "@/lib/colors";
import { formatCurrency, capitalize } from "@/lib/utils";
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
import { usePricing } from "@/lib/hooks/usePricing";

// ============================================================================
// Types
// ============================================================================

interface SalesByLocationChartProps {
  sales: Sale[];
  customers: Customer[];
  loading?: boolean;
}

interface LocationData {
  key: Location;
  label: string;
  total: number;
  containers: number;
  color: string;
}

// ============================================================================
// Component
// ============================================================================

export function SalesByLocationChart({
  sales,
  customers,
  loading = false,
}: SalesByLocationChartProps) {
  const { getEffectivePrice } = usePricing();

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
    payload?: Array<{ payload: LocationData }>;
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const dataPoint = payload[0].payload;
    const colors = getLocationColor(dataPoint.key);

    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium text-popover-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.hex }}
            aria-hidden
          />
          <span>{formatLocationLabel(dataPoint.key)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Sales: {formatCurrency(dataPoint.total)}
        </p>
        <p className="text-xs text-muted-foreground">
          Containers: {dataPoint.containers.toLocaleString()}
        </p>
      </div>
    );
  };

  // Aggregate sales by location with effective pricing
  const locationData: LocationData[] = Object.values(
    sales.reduce((acc, sale) => {
      const customer = customers.find((c) => c.id === sale.customerId);
      if (customer) {
        const locationKey = customer.location;
        if (!acc[locationKey]) {
          const colors = getLocationColor(locationKey);
          acc[locationKey] = {
            key: locationKey,
            label: formatLocationLabel(locationKey),
            total: 0,
            containers: 0,
            color: colors.hex,
          };
        }
        const effectivePrice = getEffectivePrice(customer);
        acc[locationKey].total += sale.quantity * effectivePrice;
        acc[locationKey].containers += sale.quantity;
      }
      return acc;
    }, {} as Record<string, LocationData>)
  ).sort((a, b) => b.total - a.total); // Sort descending by total

  const isEmpty = locationData.length === 0;

  // Limit to top 5 locations on mobile for better readability
  const displayData = typeof window !== 'undefined' && window.innerWidth < 640 
    ? locationData.slice(0, 5) 
    : locationData;

  return (
    <ChartWrapper
      title="Sales by Location"
      loading={loading}
      empty={isEmpty}
      emptyMessage="No sales data available"
    >
      <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
        <BarChart
          data={displayData}
          layout="vertical"
          margin={
            window.innerWidth < 640
              ? { top: 5, right: 10, left: 5, bottom: 5 }
              : { top: 5, right: 30, left: 10, bottom: 5 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            width={window.innerWidth < 640 ? 70 : 90}
            tick={{ fontSize: window.innerWidth < 640 ? 10 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
          />
          <Tooltip content={renderTooltip} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {displayData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
