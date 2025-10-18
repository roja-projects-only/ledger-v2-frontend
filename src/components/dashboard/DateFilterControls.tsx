/**
 * DateFilterControls Component
 * 
 * Main date filtering UI combining preset toggle and date range display.
 * Provides centralized date control for all dashboard components.
 */

import { useDateFilter } from "@/lib/hooks/useDateFilter";
import { DateFilterToggle } from "./DateFilterToggle";
import { SelectedDateLabel } from "./SelectedDateLabel";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface DateFilterControlsProps {
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DateFilterControls({ className }: DateFilterControlsProps) {
  const { preset, setPreset, computed, comparisonEnabled } = useDateFilter();

  return (
    <div className={cn("space-y-3", className)}>
      {/* Preset Toggle Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Period:</span>
          <DateFilterToggle 
            value={preset} 
            onChange={setPreset}
          />
        </div>
        
        {/* Selected Date Range Label */}
        <SelectedDateLabel
          label={computed.label}
          comparisonLabel={computed.comparisonLabel}
          showComparison={comparisonEnabled}
          className="text-xs"
        />
      </div>
    </div>
  );
}
