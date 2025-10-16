/**
 * SalesDistributionChart Component
 * 
 * Donut chart showing revenue distribution across locations.
 * 
 * Features:
 * - Recharts PieChart with donut style
 * - Color-coded segments matching location colors
 * - Center label showing total revenue
 * - Interactive legend with percentages
 * - Responsive layout
 */

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import type { LocationStats } from "@/lib/utils/analytics";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Types
// ============================================================================

export interface SalesDistributionChartProps {
  /** Location statistics for chart */
  locations: LocationStats[];
  /** Total revenue for center label */
  totalRevenue: number;
  /** Optional loading state */
  loading?: boolean;
}

// ============================================================================
// Custom Label Component
// ============================================================================

interface CenterLabelProps {
  viewBox?: { cx: number; cy: number };
  value: number;
}

function CenterLabel({ viewBox, value }: CenterLabelProps) {
  if (!viewBox) return null;

  return (
    <g>
      <text
        x={viewBox.cx}
        y={viewBox.cy - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-400 text-xs"
      >
        Total Revenue
      </text>
      <text
        x={viewBox.cx}
        y={viewBox.cy + 15}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white text-xl font-bold"
      >
        {formatCurrency(value)}
      </text>
    </g>
  );
}

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      location: string;
      revenue: number;
      percentage: number;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{data.payload.location}</p>
      <p className="text-sm font-semibold text-white">
        {formatCurrency(data.value)}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">
        {data.payload.percentage.toFixed(1)}% of total
      </p>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function SalesDistributionChart({
  locations,
  totalRevenue,
  loading = false,
}: SalesDistributionChartProps) {
  // Format data for chart
  const chartData = locations.map((loc) => ({
    location: loc.location
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" "),
    revenue: loc.revenue,
    percentage: loc.percentage,
    color: loc.color,
  }));

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="mb-6">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-[300px] w-full rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          Sales Distribution
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Revenue breakdown by location
        </p>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No distribution data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="revenue"
              label={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <CenterLabel value={totalRevenue} />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => (
                <span className="text-xs text-slate-300">
                  {value} ({entry.payload.percentage.toFixed(1)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
