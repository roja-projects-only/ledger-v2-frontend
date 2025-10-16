/**
 * DailySalesTrendChart - Line chart showing daily sales trend over time
 * 
 * Features:
 * - Recharts LineChart with Area fill
 * - Aggregates sales by day within date range
 * - Responsive container
 * - Loading and empty states via ChartWrapper
 */

import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartWrapper } from "@/components/shared/ChartWrapper";
import type { Sale } from "@/lib/types";
import { getSemanticColor } from "@/lib/colors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePricing } from "@/lib/hooks/usePricing";
import { useCustomers } from "@/lib/hooks/useCustomers";

// ============================================================================
// Types
// ============================================================================

interface DailySalesTrendChartProps {
  sales: Sale[];
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  loading?: boolean;
}

interface DailyData {
  date: string; // ISO date string
  displayDate: string; // Formatted date for display
  total: number;
}

// ============================================================================
// Component
// ============================================================================

export function DailySalesTrendChart({
  sales,
  startDate,
  endDate,
  loading = false,
}: DailySalesTrendChartProps) {
  const { customers } = useCustomers();
  const { getEffectivePrice } = usePricing();

  // Aggregate sales by day
  const dailyData: DailyData[] = [];
  
  // Create a map of all dates in range with 0 sales
  const start = new Date(startDate);
  const end = new Date(endDate);
  const salesByDate = new Map<string, number>();

  // Initialize all dates in range with 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    salesByDate.set(dateStr, 0);
  }

  // Aggregate actual sales with effective pricing
  sales.forEach((sale) => {
    // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
    const saleDate = sale.date.split('T')[0];
    if (saleDate >= startDate && saleDate <= endDate) {
      const customer = customers?.find((c) => c.id === sale.customerId);
      const effectivePrice = customer ? getEffectivePrice(customer) : sale.unitPrice;
      const total = sale.quantity * effectivePrice;
      const current = salesByDate.get(saleDate) || 0;
      salesByDate.set(saleDate, current + total);
    }
  });

  // Convert to array and sort by date
  salesByDate.forEach((total, date) => {
    dailyData.push({
      date,
      displayDate: formatDate(date),
      total,
    });
  });

  dailyData.sort((a, b) => a.date.localeCompare(b.date));

  const isEmpty = sales.length === 0;
  const successTone = getSemanticColor("success");
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <ChartWrapper
      title="Daily Sales Trend"
      loading={loading}
      empty={isEmpty}
      emptyMessage="No sales data available for the selected date range"
    >
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <LineChart 
          data={dailyData} 
          margin={
            isMobile
              ? { top: 5, right: 5, left: 0, bottom: 5 }
              : { top: 5, right: 20, left: 10, bottom: 5 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: isMobile ? 9 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={isMobile ? 70 : 80}
          />
          <YAxis
            tick={{ fontSize: isMobile ? 9 : 12, fill: "#94a3b8" }}
            stroke="#94a3b8"
            tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, "")}
            width={isMobile ? 50 : 60}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as DailyData;
                return (
                  <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-sm">
                    <p className="font-semibold text-popover-foreground">{data.displayDate}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sales: <span className="font-semibold text-popover-foreground">{formatCurrency(data.total)}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ stroke: successTone.hex, strokeWidth: 1, strokeOpacity: 0.2 }}
          />
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={successTone.hex} stopOpacity={0.25} />
              <stop offset="95%" stopColor={successTone.hex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            stroke={successTone.hex}
            fill="url(#colorTotal)"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={successTone.hex}
            strokeWidth={2}
            dot={{ fill: successTone.hex, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}
