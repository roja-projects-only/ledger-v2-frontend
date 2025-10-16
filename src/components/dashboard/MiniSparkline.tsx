/**
 * MiniSparkline - Small inline trend chart
 * 
 * Simple SVG line chart showing 7-day trend data.
 * No axes, labels, or grid - just a smooth trend line.
 */

import type { DailyMetric } from "@/lib/utils/analytics";

// ============================================================================
// Types
// ============================================================================

interface MiniSparklineProps {
  data: DailyMetric[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MiniSparkline({
  data,
  color = "rgb(14, 165, 233)", // sky-500
  width = 80,
  height = 24,
  className,
}: MiniSparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate dimensions
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Get min/max values for scaling
  const values = data.map((d) => d.revenue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero

  // Generate path points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.revenue - minValue) / valueRange) * chartHeight;
    return { x, y };
  });

  // Create SVG path string
  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      // Use smooth curves (quadratic bezier)
      const prevPoint = points[index - 1];
      const midX = (prevPoint.x + point.x) / 2;
      return `Q ${prevPoint.x} ${prevPoint.y} ${midX} ${point.y} T ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
