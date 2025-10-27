/**
 * DateDisplay Component - Standardized date display with multiple format options
 * 
 * Features:
 * - Multiple format options (short, long, relative, custom)
 * - Relative date display with configurable thresholds
 * - Timezone-aware formatting using Asia/Manila
 * - Accessibility support with proper ARIA labels
 * - Error handling with graceful fallbacks
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  formatDate, 
  formatDateTime, 
  formatRelativeDate, 
  safeDateFormat,
  validateDate 
} from "@/lib/utils";
// DateFormatOptions type available for future use

// ============================================================================
// Component Props
// ============================================================================

export interface DateDisplayProps {
  /** ISO date string to display */
  date: string;
  /** Format type for the date display */
  format?: 'short' | 'long' | 'relative' | 'custom';
  /** Custom format string (when format='custom') */
  customFormat?: string;
  /** Include time in the display */
  showTime?: boolean;
  /** Use relative formatting if applicable */
  relative?: boolean;
  /** Maximum days to show relative format before switching to absolute */
  maxRelativeDays?: number;
  /** Additional CSS classes */
  className?: string;
  /** Fallback text when date is invalid */
  fallback?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

// ============================================================================
// DateDisplay Component
// ============================================================================

export function DateDisplay({
  date,
  format = 'short',
  customFormat,
  showTime = false,
  relative = false,
  maxRelativeDays = 7,
  className,
  fallback = 'Invalid date',
  ariaLabel,
}: DateDisplayProps) {
  
  // Validate and format the date
  const formattedDate = useMemo(() => {
    // Validate the input date
    const validation = validateDate(date);
    if (!validation.isValid) {
      console.warn('DateDisplay: Invalid date provided:', date, validation.error);
      return fallback;
    }

    const normalizedDate = validation.normalizedDate!;

    // Handle relative formatting first
    if (relative || format === 'relative') {
      return safeDateFormat(normalizedDate, (d) => 
        formatRelativeDate(d, { 
          maxDays: maxRelativeDays, 
          includeTime: showTime 
        })
      );
    }

    // Handle other format types
    switch (format) {
      case 'short':
        return showTime 
          ? safeDateFormat(normalizedDate, formatDateTime)
          : safeDateFormat(normalizedDate, formatDate);
      
      case 'long':
        // For long format, always include time
        return safeDateFormat(normalizedDate, formatDateTime);
      
      case 'custom':
        if (!customFormat) {
          console.warn('DateDisplay: Custom format specified but no customFormat provided');
          return safeDateFormat(normalizedDate, formatDate);
        }
        // For custom format, we'd need to implement custom formatting
        // For now, fall back to standard formatting
        return showTime 
          ? safeDateFormat(normalizedDate, formatDateTime)
          : safeDateFormat(normalizedDate, formatDate);
      
      default:
        return showTime 
          ? safeDateFormat(normalizedDate, formatDateTime)
          : safeDateFormat(normalizedDate, formatDate);
    }
  }, [date, format, customFormat, showTime, relative, maxRelativeDays, fallback]);

  // Generate appropriate ARIA label
  const accessibilityLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    // Provide a descriptive label for screen readers
    const validation = validateDate(date);
    if (!validation.isValid) return 'Invalid date';
    
    // Always provide the full date for accessibility, regardless of display format
    return safeDateFormat(validation.normalizedDate!, formatDateTime);
  }, [date, ariaLabel]);

  return (
    <time 
      dateTime={date}
      aria-label={accessibilityLabel}
      className={cn(
        "inline-block",
        className
      )}
    >
      {formattedDate}
    </time>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Short date display (e.g., "Oct 15, 2025")
 */
export function ShortDate({ date, className, ...props }: Omit<DateDisplayProps, 'format'>) {
  return (
    <DateDisplay 
      date={date} 
      format="short" 
      className={className}
      {...props} 
    />
  );
}

/**
 * Long date display with time (e.g., "Oct 15, 2025 2:45 PM")
 */
export function LongDate({ date, className, ...props }: Omit<DateDisplayProps, 'format' | 'showTime'>) {
  return (
    <DateDisplay 
      date={date} 
      format="long" 
      showTime={true}
      className={className}
      {...props} 
    />
  );
}

/**
 * Relative date display (e.g., "Today", "Yesterday", "2 days ago")
 */
export function RelativeDate({ 
  date, 
  maxRelativeDays = 7, 
  className, 
  ...props 
}: Omit<DateDisplayProps, 'format' | 'relative'>) {
  return (
    <DateDisplay 
      date={date} 
      format="relative" 
      relative={true}
      maxRelativeDays={maxRelativeDays}
      className={className}
      {...props} 
    />
  );
}