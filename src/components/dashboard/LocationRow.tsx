/**
 * LocationRow Component
 * 
 * Displays a single location's performance metrics with visual indicators.
 * 
 * Features:
 * - Rank badge with gradient background
 * - Location color dot indicator
 * - Revenue display with formatting
 * - Progress bar showing relative performance
 * - Responsive layout
 */

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LocationStats } from "@/lib/utils/analytics";

// ============================================================================
// Types
// ============================================================================

export interface LocationRowProps {
  /** Location statistics data */
  location: LocationStats;
  /** Rank position (1-based) */
  rank: number;
  /** Maximum revenue for percentage calculation */
  maxRevenue: number;
  /** Optional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function LocationRow({
  location,
  rank,
  maxRevenue,
  className,
}: LocationRowProps) {
  // Calculate percentage for progress bar
  const percentage = maxRevenue > 0 
    ? Math.round((location.revenue / maxRevenue) * 100)
    : 0;

  // Format location name (replace underscores with spaces)
  const formattedName = location.location
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Rank Badge */}
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          "text-xs font-semibold",
          rank === 1 && "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
          rank === 2 && "bg-gradient-to-br from-slate-400 to-slate-500 text-white",
          rank === 3 && "bg-gradient-to-br from-orange-600 to-orange-700 text-white",
          rank > 3 && "bg-slate-700 text-slate-300",
        )}
      >
        {rank}
      </div>

      {/* Location Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {/* Color Dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: location.color }}
            aria-label={`${formattedName} indicator`}
          />
          
          {/* Location Name */}
          <span className="text-sm font-medium truncate">
            {formattedName}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: location.color,
            }}
            aria-label={`${percentage}% of top location`}
          />
        </div>
      </div>

      {/* Revenue */}
      <div className="flex-shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(location.revenue)}
      </div>
    </div>
  );
}
