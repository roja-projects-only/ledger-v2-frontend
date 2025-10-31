/**
 * useDateSelection - Custom hook for managing single date selection state
 * 
 * Features:
 * - Date validation and boundary checking
 * - Support for default dates and reset functionality
 * - Timezone-aware date handling (Asia/Manila)
 * - Error state management
 * - Validation callbacks
 */

import { useState, useCallback, useMemo } from "react";
import { 
  createManilaDate, 
  toLocalISODate,
  getTodayISO 
} from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface UseDateSelectionOptions {
  /** Initial date value */
  defaultDate?: Date;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Custom validation function */
  validate?: (date: Date | undefined) => string | null;
  /** Whether to auto-reset to default on invalid selection */
  autoReset?: boolean;
}

export interface UseDateSelectionReturn {
  /** Currently selected date */
  selectedDate: Date | undefined;
  /** ISO string of selected date */
  selectedDateISO: string | undefined;
  /** Whether the current selection is valid */
  isValid: boolean;
  /** Current error message if any */
  error: string | null;
  /** Whether the date is at minimum boundary */
  isAtMin: boolean;
  /** Whether the date is at maximum boundary */
  isAtMax: boolean;
  /** Select a new date */
  selectDate: (date: Date | undefined) => void;
  /** Reset to default date */
  reset: () => void;
  /** Clear the selection */
  clear: () => void;
  /** Check if a date is selectable */
  isDateSelectable: (date: Date) => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useDateSelection(options: UseDateSelectionOptions = {}): UseDateSelectionReturn {
  const {
    defaultDate,
    minDate,
    maxDate,
    validate,
    autoReset = false,
  } = options;

  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const selectedDateISO = useMemo(() => {
    return selectedDate ? toLocalISODate(selectedDate) : undefined;
  }, [selectedDate]);

  const isValid = useMemo(() => {
    return error === null;
  }, [error]);

  const isAtMin = useMemo(() => {
    if (!selectedDate || !minDate) return false;
    return selectedDate.getTime() === minDate.getTime();
  }, [selectedDate, minDate]);

  const isAtMax = useMemo(() => {
    if (!selectedDate || !maxDate) return false;
    return selectedDate.getTime() === maxDate.getTime();
  }, [selectedDate, maxDate]);

  // Validation function
  const validateSelection = useCallback((date: Date | undefined): string | null => {
    if (!date) return null;

    // Check boundaries
    if (minDate && date < minDate) {
      return `Date cannot be before ${toLocalISODate(minDate)}`;
    }
    if (maxDate && date > maxDate) {
      return `Date cannot be after ${toLocalISODate(maxDate)}`;
    }

    // Custom validation
    if (validate) {
      return validate(date);
    }

    return null;
  }, [minDate, maxDate, validate]);

  // Check if a date is selectable
  const isDateSelectable = useCallback((date: Date): boolean => {
    return validateSelection(date) === null;
  }, [validateSelection]);

  // Select date function
  const selectDate = useCallback((date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      setError(null);
      return;
    }

    // Ensure date is in Manila timezone
    const manilaDate = createManilaDate(toLocalISODate(date));
    const validationError = validateSelection(manilaDate);

    if (validationError) {
      setError(validationError);
      if (autoReset && defaultDate) {
        setSelectedDate(defaultDate);
      } else {
        setSelectedDate(manilaDate);
      }
    } else {
      setSelectedDate(manilaDate);
      setError(null);
    }
  }, [validateSelection, autoReset, defaultDate]);

  // Reset function
  const reset = useCallback(() => {
    setSelectedDate(defaultDate);
    setError(null);
  }, [defaultDate]);

  // Clear function
  const clear = useCallback(() => {
    setSelectedDate(undefined);
    setError(null);
  }, []);

  return {
    selectedDate,
    selectedDateISO,
    isValid,
    error,
    isAtMin,
    isAtMax,
    selectDate,
    reset,
    clear,
    isDateSelectable,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for selecting dates in the past (no future dates)
 */
export function usePastDateSelection(options: Omit<UseDateSelectionOptions, 'maxDate'> = {}) {
  return useDateSelection({
    ...options,
    maxDate: new Date(), // Today is the maximum
  });
}

/**
 * Hook for selecting dates in the future (no past dates)
 */
export function useFutureDateSelection(options: Omit<UseDateSelectionOptions, 'minDate'> = {}) {
  return useDateSelection({
    ...options,
    minDate: new Date(), // Today is the minimum
  });
}

/**
 * Hook for selecting today's date with reset functionality
 */
export function useTodayDateSelection() {
  const today = useMemo(() => createManilaDate(getTodayISO()), []);
  
  return useDateSelection({
    defaultDate: today,
    minDate: today,
    maxDate: today,
  });
}