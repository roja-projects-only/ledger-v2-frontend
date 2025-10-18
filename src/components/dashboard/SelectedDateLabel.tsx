/**
 * SelectedDateLabel Component
 * 
 * Displays the currently selected date range in human-readable format.
 * Shows both the main period and comparison period (if enabled).
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
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Calendar className="w-4 h-4" />
      <span>
        <span className="font-medium text-foreground">{label}</span>
        {showComparison && comparisonLabel && (
          <span className="ml-2">
            {comparisonLabel}
          </span>
        )}
      </span>
    </div>
  );
}
