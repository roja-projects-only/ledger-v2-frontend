/**
 * useDateFilter - Custom hook for accessing date filter state
 * 
 * Convenience hook that wraps DateFilterContext and provides
 * easy access to date filtering functionality throughout the app.
 */

import { useDateFilterContext } from "@/lib/contexts/useDateFilterContext";
import type { DateFilterPreset, CustomDateRange } from "@/lib/types/dateFilter";

// ============================================================================
// Hook
// ============================================================================

export function useDateFilter() {
  const context = useDateFilterContext();
  
  return {
    // Current state
    mode: context.state.mode,
    preset: context.state.preset,
    customRange: context.state.customRange,
    comparisonEnabled: context.state.comparisonEnabled,
    
    // Computed values
    computed: context.computed,
    
    // Actions
    setPreset: (preset: DateFilterPreset) => context.setPreset(preset),
    setCustomRange: (range: CustomDateRange) => context.setCustomRange(range),
    toggleComparison: () => context.toggleComparison(),
    reset: () => context.reset(),
  };
}
