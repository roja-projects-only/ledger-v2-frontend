/**
 * TimePeriodToggle Component
 * 
 * Tab-style toggle for selecting time periods (7D, 30D, 90D, 1Y).
 * Used in charts to switch between different data ranges.
 * 
 * Features:
 * - Pill-shaped toggle with active state highlighting
 * - Accessible keyboard navigation
 * - Smooth transitions between states
 * - Dark theme optimized
 */

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type TimePeriod = "7D" | "30D" | "90D" | "1Y";

export interface TimePeriodToggleProps {
  /** Currently selected period */
  value: TimePeriod;
  /** Callback when period changes */
  onChange: (period: TimePeriod) => void;
  /** Optional additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "7D", label: "7 Days" },
  { value: "30D", label: "30 Days" },
  { value: "90D", label: "90 Days" },
  { value: "1Y", label: "1 Year" },
];

// ============================================================================
// Component
// ============================================================================

export function TimePeriodToggle({
  value,
  onChange,
  className,
}: TimePeriodToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Time period selection"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg",
        "bg-slate-800 border border-slate-700",
        className,
      )}
    >
      {PERIODS.map((period) => {
        const isActive = value === period.value;

        return (
          <button
            key={period.value}
            role="tab"
            aria-selected={isActive}
            aria-label={`View ${period.label}`}
            onClick={() => onChange(period.value)}
            className={cn(
              // Base styles
              "px-3 py-1.5 rounded-md text-sm font-medium",
              "transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
              
              // Active state
              isActive && [
                "bg-sky-600 text-white shadow-sm",
              ],
              
              // Inactive state
              !isActive && [
                "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50",
              ],
            )}
          >
            {period.value}
          </button>
        );
      })}
    </div>
  );
}
