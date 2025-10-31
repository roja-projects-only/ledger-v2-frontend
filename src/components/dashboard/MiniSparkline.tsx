/**
 * MiniSparkline - Small inline trend chart with gradient fill
 * 
 * ⚠️ PRICING: Receives pre-calculated revenue from parent component
 * - Revenue already respects enableCustomPricing toggle
 * - Data calculated via analytics utilities with getEffectivePriceFromData()
 * - See: src/lib/hooks/useDashboardData.ts and docs/PRICING_GUIDE.md
 * 
 * Responsive SVG line chart showing last 7 days of selected date range.
 * Automatically follows Dashboard date filter (7D, 30D, 90D, 1Y).
 * Features smooth curves with gradient fill for better visual appeal.
 * Memoized for performance optimization.
 */

import { memo, useMemo } from "react";
import type { DailyMetric } from "@/lib/utils/analytics";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface MiniSparklineProps {
  data: DailyMetric[];
  color?: string;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate smooth curve path using Catmull-Rom splines
 * Better than quadratic bezier for multiple points
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  
  const path: string[] = [];
  path.push(`M ${points[0].x},${points[0].y}`);
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    // Simple smooth curve using control points
    const controlX = (current.x + next.x) / 2;
    path.push(`Q ${current.x},${current.y} ${controlX},${(current.y + next.y) / 2}`);
    path.push(`T ${next.x},${next.y}`);
  }
  
  return path.join(" ");
}

// ============================================================================
// Component
// ============================================================================

export function MiniSparkline({
  data,
  color = "rgb(14, 165, 233)", // sky-500
  className,
}: MiniSparklineProps) {
  // Calculate path and gradient with useMemo for performance
  const { linePath, areaPath, gradientId } = useMemo(() => {
    if (!data || data.length === 0) {
      return { linePath: "", areaPath: "", gradientId: "" };
    }
    // ViewBox dimensions - using percentage-based responsive sizing
    const viewWidth = 100;
    const viewHeight = 40;
    const padding = 4; // Increased padding to prevent cutoff
    
    const chartWidth = viewWidth - padding * 2;
    const chartHeight = viewHeight - padding * 2;

    // Get min/max values for scaling
    const values = data.map((d) => d.revenue);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Generate normalized points
    const points = data.map((d, index) => {
      const x = padding + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding + chartHeight - ((d.revenue - minValue) / valueRange) * chartHeight;
      return { x, y };
    });

    // Create line path
    const line = generateSmoothPath(points);

    // Create area path (line + bottom fill)
    const area = points.length > 0
      ? `${line} L ${points[points.length - 1].x},${viewHeight - padding} L ${points[0].x},${viewHeight - padding} Z`
      : "";

    // Unique gradient ID per component instance
    const id = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return {
      linePath: line,
      areaPath: area,
      gradientId: id,
    };
  }, [data]);

  // Early return after hooks
  if (!data || data.length === 0) {
    return (
      <div className={cn("h-8 flex items-center justify-center", className)}>
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-8 relative overflow-hidden", className)}>
      <svg
        viewBox="0 0 100 40"
        className="w-full h-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient fill for area */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill with gradient */}
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="transition-all duration-300"
        />
        
        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

// Export memoized version for performance
export default memo(MiniSparkline);
