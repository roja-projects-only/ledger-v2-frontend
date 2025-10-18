/**
 * SelectedDateLabel Component
 * 
 * Displays the currently selected date range in human-readable format.
 * Shows both the main period and comparison period (if enabled).
 * Optimized for accessibility and responsive text sizing.
 */

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SelectedDateLabelProps {
  label: string;
  comparisonLabel?: string;
  showComparison?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SelectedDateLabel({ 
  label, 
  comparisonLabel, 
  showComparison = true,
  className 
}: SelectedDateLabelProps) {
  return (
    <div 
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="status"
      aria-live="polite"
      aria-label={`Selected date range: ${label}${showComparison && comparisonLabel ? `, compared to ${comparisonLabel}` : ''}`}
    >
      <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">
        <span className="font-medium text-foreground">{label}</span>
        {showComparison && comparisonLabel && (
          <span className="ml-2 hidden sm:inline">
            {comparisonLabel}
          </span>
        )}
      </span>
    </div>
  );
}
