/**
 * useDateRange - Custom hook for managing date range selection with validation
 * 
 * Features:
 * - Date range validation with start/end date checking
 * - Automatic end date adjustment when start date changes
 * - Maximum range validation
 * - Timezone-aware date handling (Asia/Manila)
 * - Error state management
 * - Preset range functionality
 */

import { useState, useCallback, useMemo } from "react";
import { 
  validateDateRange, 
  createManilaDate, 
  toLocalISODate,
  getTodayISO,
  formatDateRange 
} from "@/lib/utils";
import { DATE_RANGE_PRESETS } from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

export interface UseDateRangeOptions {
  /** Initial start date */
  defaultStartDate?: Date;
  /** Initial end date */
  defaultEndDate?: Date;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Maximum range in days */
  maxRange?: number;
  /** Custom validation function */
  validate?: (startDate: Date | undefined, endDate: Date | undefined) => string | null;
  /** Whether to auto-adjust end date when start date changes */
  autoAdjustEnd?: boolean;
  /** Whether to auto-reset to default on invalid selection */
  autoReset?: boolean;
}

export interface UseDateRangeReturn {
  /** Currently selected start date */
  startDate: Date | undefined;
  /** Currently selected end date */
  endDate: Date | undefined;
  /** ISO string of start date */
  startDateISO: string | undefined;
  /** ISO string of end date */
  endDateISO: string | undefined;
  /** Formatted date range string */
  formattedRange: string | undefined;
  /** Whether the current range is valid */
  isValid: boolean;
  /** Current error message if any */
  error: string | null;
  /** Whether a complete range is selected */
  hasCompleteRange: boolean;
  /** Number of days in the current range */
  rangeDays: number;
  /** Select start date */
  selectStartDate: (date: Date | undefined) => void;
  /** Select end date */
  selectEndDate: (date: Date | undefined) => void;
  /** Select both dates at once */
  selectRange: (startDate: Date | undefined, endDate: Date | undefined) => void;
  /** Reset to default dates */
  reset: () => void;
  /** Clear the selection */
  clear: () => void;
  /** Set a preset range */
  setPresetRange: (preset: keyof typeof DATE_RANGE_PRESETS) => void;
  /** Check if a date is selectable for start */
  isStartDateSelectable: (date: Date) => boolean;
  /** Check if a date is selectable for end */
  isEndDateSelectable: (date: Date) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeReturn {
  const {
    defaultStartDate,
    defaultEndDate,
    minDate,
    maxDate,
    maxRange,
    validate,
    autoAdjustEnd = false,
    autoReset = false,
  } = options;

  // State
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const startDateISO = useMemo(() => {
    return startDate ? toLocalISODate(startDate) : undefined;
  }, [startDate]);

  const endDateISO = useMemo(() => {
    return endDate ? toLocalISODate(endDate) : undefined;
  }, [endDate]);

  const formattedRange = useMemo(() => {
    if (!startDateISO || !endDateISO) return undefined;
    return formatDateRange(startDateISO, endDateISO);
  }, [startDateISO, endDateISO]);

  const isValid = useMemo(() => {
    return error === null;
  }, [error]);

  const hasCompleteRange = useMemo(() => {
    return startDate !== undefined && endDate !== undefined;
  }, [startDate, endDate]);

  const rangeDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }, [startDate, endDate]);

  // Validation function
  const validateRange = useCallback((start: Date | undefined, end: Date | undefined): string | null => {
    if (!start && !end) return null;

    // Check individual date boundaries
    if (start) {
      if (minDate && start < minDate) {
        return `Start date cannot be before ${toLocalISODate(minDate)}`;
      }
      if (maxDate && start > maxDate) {
        return `Start date cannot be after ${toLocalISODate(maxDate)}`;
      }
    }

    if (end) {
      if (minDate && end < minDate) {
        return `End date cannot be before ${toLocalISODate(minDate)}`;
      }
      if (maxDate && end > maxDate) {
        return `End date cannot be after ${toLocalISODate(maxDate)}`;
      }
    }

    // Check range validity
    if (start && end) {
      const startISO = toLocalISODate(start);
      const endISO = toLocalISODate(end);
      
      const rangeValidation = validateDateRange(startISO, endISO);
      if (!rangeValidation.isValid) {
        return rangeValidation.error || 'Invalid date range';
      }

      // Check maximum range
      if (maxRange) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > maxRange) {
          return `Date range cannot exceed ${maxRange} days`;
        }
      }
    }

    // Custom validation
    if (validate) {
      return validate(start, end);
    }

    return null;
  }, [minDate, maxDate, maxRange, validate]);

  // Check if a date is selectable for start
  const isStartDateSelectable = useCallback((date: Date): boolean => {
    const testError = validateRange(date, endDate);
    return testError === null;
  }, [validateRange, endDate]);

  // Check if a date is selectable for end
  const isEndDateSelectable = useCallback((date: Date): boolean => {
    const testError = validateRange(startDate, date);
    return testError === null;
  }, [validateRange, startDate]);

  // Select start date function
  const selectStartDate = useCallback((date: Date | undefined) => {
    if (!date) {
      setStartDate(undefined);
      setError(null);
      return;
    }

    const manilaDate = createManilaDate(toLocalISODate(date));
    let newEndDate = endDate;

    // Auto-adjust end date if needed
    if (autoAdjustEnd && endDate && manilaDate > endDate) {
      newEndDate = manilaDate;
      setEndDate(newEndDate);
    }

    const validationError = validateRange(manilaDate, newEndDate);

    if (validationError) {
      setError(validationError);
      if (autoReset && defaultStartDate) {
        setStartDate(defaultStartDate);
      } else {
        setStartDate(manilaDate);
      }
    } else {
      setStartDate(manilaDate);
      setError(null);
    }
  }, [endDate, autoAdjustEnd, validateRange, autoReset, defaultStartDate]);

  // Select end date function
  const selectEndDate = useCallback((date: Date | undefined) => {
    if (!date) {
      setEndDate(undefined);
      setError(null);
      return;
    }

    const manilaDate = createManilaDate(toLocalISODate(date));
    const validationError = validateRange(startDate, manilaDate);

    if (validationError) {
      setError(validationError);
      if (autoReset && defaultEndDate) {
        setEndDate(defaultEndDate);
      } else {
        setEndDate(manilaDate);
      }
    } else {
      setEndDate(manilaDate);
      setError(null);
    }
  }, [startDate, validateRange, autoReset, defaultEndDate]);

  // Select range function
  const selectRange = useCallback((start: Date | undefined, end: Date | undefined) => {
    const manilaStart = start ? createManilaDate(toLocalISODate(start)) : undefined;
    const manilaEnd = end ? createManilaDate(toLocalISODate(end)) : undefined;
    
    const validationError = validateRange(manilaStart, manilaEnd);

    if (validationError) {
      setError(validationError);
      if (autoReset) {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
      } else {
        setStartDate(manilaStart);
        setEndDate(manilaEnd);
      }
    } else {
      setStartDate(manilaStart);
      setEndDate(manilaEnd);
      setError(null);
    }
  }, [validateRange, autoReset, defaultStartDate, defaultEndDate]);

  // Reset function
  const reset = useCallback(() => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setError(null);
  }, [defaultStartDate, defaultEndDate]);

  // Clear function
  const clear = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
    setError(null);
  }, []);

  // Set preset range function
  const setPresetRange = useCallback((preset: keyof typeof DATE_RANGE_PRESETS) => {
    const days = DATE_RANGE_PRESETS[preset];
    const today = createManilaDate(getTodayISO());
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days + 1); // +1 to include today

    selectRange(pastDate, today);
  }, [selectRange]);

  return {
    startDate,
    endDate,
    startDateISO,
    endDateISO,
    formattedRange,
    isValid,
    error,
    hasCompleteRange,
    rangeDays,
    selectStartDate,
    selectEndDate,
    selectRange,
    reset,
    clear,
    setPresetRange,
    isStartDateSelectable,
    isEndDateSelectable,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for selecting date ranges in the past (no future dates)
 */
export function usePastDateRange(options: Omit<UseDateRangeOptions, 'maxDate'> = {}) {
  return useDateRange({
    ...options,
    maxDate: new Date(), // Today is the maximum
  });
}

/**
 * Hook for selecting date ranges with a maximum of 30 days
 */
export function useMonthlyDateRange(options: Omit<UseDateRangeOptions, 'maxRange'> = {}) {
  return useDateRange({
    ...options,
    maxRange: 30,
  });
}

/**
 * Hook for selecting date ranges with a maximum of 7 days
 */
export function useWeeklyDateRange(options: Omit<UseDateRangeOptions, 'maxRange'> = {}) {
  return useDateRange({
    ...options,
    maxRange: 7,
  });
}

/**
 * Hook for last 7 days range with preset functionality
 */
export function useLastSevenDaysRange() {
  const today = useMemo(() => createManilaDate(getTodayISO()), []);
  const sevenDaysAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6); // -6 to include today (7 days total)
    return date;
  }, [today]);

  return useDateRange({
    defaultStartDate: sevenDaysAgo,
    defaultEndDate: today,
    maxDate: today,
    maxRange: 7,
  });
}