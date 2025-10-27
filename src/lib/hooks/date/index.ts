/**
 * Date State Management Hooks - Custom hooks for date selection and range management
 * 
 * This module exports all date state management hooks for consistent
 * date handling and state management across the application.
 */

// Date selection hooks
export { 
  useDateSelection, 
  usePastDateSelection, 
  useFutureDateSelection, 
  useTodayDateSelection 
} from '../useDateSelection';

// Date range hooks
export { 
  useDateRange, 
  usePastDateRange, 
  useMonthlyDateRange, 
  useWeeklyDateRange, 
  useLastSevenDaysRange 
} from '../useDateRange';

// Re-export types for convenience
export type { 
  UseDateSelectionOptions, 
  UseDateSelectionReturn 
} from '../useDateSelection';

export type { 
  UseDateRangeOptions, 
  UseDateRangeReturn 
} from '../useDateRange';