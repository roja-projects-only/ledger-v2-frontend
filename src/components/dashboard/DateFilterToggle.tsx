/**
 * DateFilterToggle Component
 * 
 * Toggle buttons for preset date filter periods (7D, 30D, 90D, 1Y).
 * Used in dashboard to quickly switch between common time periods.
 */

import { cn } from "@/lib/utils";
import type { DateFilterPreset } from "@/lib/types/dateFilter";

// ============================================================================
// Types
// ============================================================================

interface DateFilterToggleProps {
  value: DateFilterPreset;
  onChange: (preset: DateFilterPreset) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DateFilterToggle({ value, onChange, className }: DateFilterToggleProps) {
  const presets: { value: DateFilterPreset; label: string }[] = [
    { value: "7D", label: "7D" },
    { value: "30D", label: "30D" },
    { value: "90D", label: "90D" },
    { value: "1Y", label: "1Y" },
  ];

  return (
    <div
      className={cn("inline-flex rounded-lg bg-slate-800 p-1", className)}
      role="group"
      aria-label="Date filter period"
    >
      {presets.map((preset) => {
        const isActive = value === preset.value;
        
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
              "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900",
              isActive
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
            aria-pressed={isActive}
            aria-label={`Show last ${preset.label}`}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
