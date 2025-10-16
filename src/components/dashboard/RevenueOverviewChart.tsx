/**
 * RevenueOverviewChart Component
 * 
 * Area chart displaying revenue trends over selected time period.
 * Uses Recharts with gradient fill and responsive design.
 * 
 * Features:
 * - Smooth area chart with gradient fill
 * - Time period toggle (7D/30D/90D/1Y)
 * - Responsive tooltip with formatted values
 * - Dark theme optimized
 * - Automatic Y-axis scaling
 */

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimePeriodToggle } from "./TimePeriodToggle";
import type { TimePeriod } from "./TimePeriodToggle";
import { formatCurrencyAxis, formatDateAxis } from "@/lib/utils/chartHelpers";
import { formatCurrency } from "@/lib/utils";
import type { ChartDataPoint } from "@/lib/utils/chartHelpers";

// ============================================================================
// Types
// ============================================================================

export interface RevenueOverviewChartProps {
  /** Chart data for each time period */
  data: {
    "7D": ChartDataPoint[];
    "30D": ChartDataPoint[];
    "90D": ChartDataPoint[];
    "1Y": ChartDataPoint[];
  };
  /** Optional loading state */
  loading?: boolean;
}

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{data.payload.displayDate}</p>
      <p className="text-sm font-semibold text-white">
        {formatCurrency(data.value)}
      </p>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function RevenueOverviewChart({ data, loading = false }: RevenueOverviewChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("30D");

  const chartData = data[period];

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-40 bg-slate-700 animate-pulse rounded" />
          <div className="h-9 w-64 bg-slate-700 animate-pulse rounded-lg" />
        </div>
        <div className="h-[300px] bg-slate-800/50 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Revenue Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily revenue trend for selected period
          </p>
        </div>
        
        <TimePeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(14 165 233)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(51 65 85)"
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDateAxis(value, period)}
            stroke="rgb(148 163 184)"
            style={{ fontSize: "12px" }}
            tickLine={false}
            axisLine={{ stroke: "rgb(71 85 105)" }}
          />

          {/* Y Axis */}
          <YAxis
            tickFormatter={formatCurrencyAxis}
            stroke="rgb(148 163 184)"
            style={{ fontSize: "12px" }}
            tickLine={false}
            axisLine={false}
            width={60}
          />

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgb(100 116 139)" }} />

          {/* Area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgb(14 165 233)"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
