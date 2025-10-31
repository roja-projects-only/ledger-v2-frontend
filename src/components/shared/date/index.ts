/**
 * Date Display Components - Standardized date display components
 * 
 * This module exports all date display components for consistent
 * date formatting and display across the application.
 */

// Main components
export { DateDisplay, ShortDate, LongDate, RelativeDate } from '../DateDisplay';
export { DateRangeDisplay, ShortDateRange, DateRangeWithSeparator, StyledDateRange } from '../DateRangeDisplay';
export { RelativeTime, FastRelativeTime, SlowRelativeTime, StaticRelativeTime, ShortRelativeTime } from '../RelativeTime';

// Re-export types for convenience
export type { DateDisplayProps } from '../DateDisplay';
export type { DateRangeDisplayProps } from '../DateRangeDisplay';
export type { RelativeTimeProps } from '../RelativeTime';