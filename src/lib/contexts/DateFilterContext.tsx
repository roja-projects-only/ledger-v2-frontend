/**
 * DateFilterContext - Global date filter state management
 * 
 * Provides centralized date filtering for dashboard components.
 * Supports preset periods (7D, 30D, 90D, 1Y) and custom date ranges.
 */

import { useState, useMemo, type ReactNode } from "react";
import type { DateFilterPreset, CustomDateRange, ComputedDateRange, DateFilterState } from "@/lib/types/dateFilter";
import { DateFilterContext, type DateFilterContextValue } from "./dateFilterContextBase";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate date range based on preset period
 */
function calculatePresetRange(preset: DateFilterPreset): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case '7D':
      start.setDate(start.getDate() - 6); // Last 7 days including today
      break;
    case '30D':
      start.setDate(start.getDate() - 29); // Last 30 days including today
      break;
    case '90D':
      start.setDate(start.getDate() - 89); // Last 90 days including today
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1); // Last 365 days
      break;
  }
  
  return { start, end };
}

/**
 * Calculate comparison period (previous period of equal length)
 */
function calculateComparisonRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const periodLength = endDate.getTime() - startDate.getTime();
  
  const comparisonEnd = new Date(startDate.getTime() - 1); // Day before period start
  comparisonEnd.setHours(23, 59, 59, 999);
  
  const comparisonStart = new Date(comparisonEnd.getTime() - periodLength);
  comparisonStart.setHours(0, 0, 0, 0);
  
  return { start: comparisonStart, end: comparisonEnd };
}

/**
 * Format date range as human-readable label
 */
function formatDateRangeLabel(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // If same day, show only one date
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  // If same year, omit year from start date
  if (start.getFullYear() === end.getFullYear()) {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = formatDate(end);
    return `${startStr} - ${endStr}`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Format comparison label
 */
function formatComparisonLabel(start: Date, end: Date, mode: 'preset' | 'custom', preset?: DateFilterPreset): string {
  if (mode === 'preset' && preset) {
    const days = preset === '7D' ? 7 : preset === '30D' ? 30 : preset === '90D' ? 90 : 365;
    return `vs previous ${days} days`;
  }
  
  return `vs ${formatDateRangeLabel(start, end)}`;
}

// ============================================================================
// Provider Component
// ============================================================================

interface DateFilterProviderProps {
  children: ReactNode;
}

export function DateFilterProvider({ children }: DateFilterProviderProps) {
  const [state, setState] = useState<DateFilterState>({
    mode: 'preset',
    preset: '30D',
    customRange: null,
    comparisonEnabled: true,
  });

  // Compute date ranges based on current state
  const computed = useMemo<ComputedDateRange>(() => {
    let startDate: Date;
    let endDate: Date;
    
    if (state.mode === 'custom' && state.customRange) {
      startDate = new Date(state.customRange.start);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(state.customRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = calculatePresetRange(state.preset);
      startDate = range.start;
      endDate = range.end;
    }
    
    const comparisonRange = calculateComparisonRange(startDate, endDate);
    
    return {
      startDate,
      endDate,
      comparisonStartDate: comparisonRange.start,
      comparisonEndDate: comparisonRange.end,
      label: formatDateRangeLabel(startDate, endDate),
      comparisonLabel: formatComparisonLabel(
        comparisonRange.start,
        comparisonRange.end,
        state.mode,
        state.preset
      ),
    };
  }, [state]);

  // Action handlers
  const setPreset = (preset: DateFilterPreset) => {
    setState({
      mode: 'preset',
      preset,
      customRange: null,
      comparisonEnabled: state.comparisonEnabled,
    });
  };

  const setCustomRange = (range: CustomDateRange) => {
    setState({
      mode: 'custom',
      preset: state.preset,
      customRange: range,
      comparisonEnabled: state.comparisonEnabled,
    });
  };

  const toggleComparison = () => {
    setState(prev => ({
      ...prev,
      comparisonEnabled: !prev.comparisonEnabled,
    }));
  };

  const reset = () => {
    setState({
      mode: 'preset',
      preset: '30D',
      customRange: null,
      comparisonEnabled: true,
    });
  };

  const value: DateFilterContextValue = {
    state,
    computed,
    setPreset,
    setCustomRange,
    toggleComparison,
    reset,
  };

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  );
}

// Hook lives in useDateFilterContext.ts to keep react-refresh happy.
