/**
 * DateRangeDisplay Component - Standardized date range display with smart formatting
 * 
 * Features:
 * - Smart date range formatting (same year/month optimization)
 * - Multiple format options (short, long)
 * - Configurable separators and styles
 * - Accessibility support with proper ARIA labels
 * - Error handling with graceful fallbacks
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  formatDateRange, 
  validateDateRange,
  safeDateFormat 
} from "@/lib/utils";

// ============================================================================
// Component Props
// ============================================================================

export interface DateRangeDisplayProps {
  /** Start date ISO string */
  startDate: string;
  /** End date ISO string */
  endDate: string;
  /** Format type for the date range display */
  format?: 'short' | 'long';
  /** Separator between start and end dates */
  separator?: string;
  /** Additional CSS classes */
  className?: string;
  /** Fallback text when dates are invalid */
  fallback?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Show individual date components with custom styling */
  renderCustom?: (startFormatted: string, endFormatted: string, separator: string) => React.ReactNode;
}

// ============================================================================
// DateRangeDisplay Component
// ============================================================================

export function DateRangeDisplay({
  startDate,
  endDate,
  format = 'short',
  separator = ' - ',
  className,
  fallback = 'Invalid date range',
  ariaLabel,
  renderCustom,
}: DateRangeDisplayProps) {
  
  // Validate and format the date range
  const { formattedRange, isValid, startFormatted, endFormatted } = useMemo(() => {
    // Validate the date range
    const validation = validateDateRange(startDate, endDate);
    if (!validation.isValid) {
      console.warn('DateRangeDisplay: Invalid date range provided:', {
        startDate,
        endDate,
        error: validation.error
      });
      return { 
        formattedRange: fallback, 
        isValid: false,
        startFormatted: '',
        endFormatted: ''
      };
    }

    const { start, end } = validation.normalizedRange!;
    
    // Format the date range using the utility function
    const formatted = safeDateFormat(start, (startD) => 
      formatDateRange(startD, end, separator)
    );

    // Also get individual formatted dates for custom rendering
    const startFmt = safeDateFormat(start, (d) => d);
    const endFmt = safeDateFormat(end, (d) => d);

    return { 
      formattedRange: formatted, 
      isValid: true,
      startFormatted: startFmt,
      endFormatted: endFmt
    };
  }, [startDate, endDate, separator, fallback, format]);

  // Generate appropriate ARIA label
  const accessibilityLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    if (!isValid) return 'Invalid date range';
    
    // Provide a descriptive label for screen readers
    return `Date range from ${startFormatted} to ${endFormatted}`;
  }, [ariaLabel, isValid, startFormatted, endFormatted]);

  // Handle custom rendering
  if (renderCustom && isValid) {
    return (
      <span 
        aria-label={accessibilityLabel}
        className={cn("inline-block", className)}
      >
        {renderCustom(startFormatted, endFormatted, separator)}
      </span>
    );
  }

  return (
    <span 
      aria-label={accessibilityLabel}
      className={cn("inline-block", className)}
    >
      {formattedRange}
    </span>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Short date range display with default formatting
 */
export function ShortDateRange({ 
  startDate, 
  endDate, 
  className, 
  ...props 
}: Omit<DateRangeDisplayProps, 'format'>) {
  return (
    <DateRangeDisplay 
      startDate={startDate}
      endDate={endDate}
      format="short" 
      className={className}
      {...props} 
    />
  );
}

/**
 * Date range display with custom separator
 */
export function DateRangeWithSeparator({ 
  startDate, 
  endDate, 
  separator = ' to ',
  className, 
  ...props 
}: DateRangeDisplayProps) {
  return (
    <DateRangeDisplay 
      startDate={startDate}
      endDate={endDate}
      separator={separator}
      className={className}
      {...props} 
    />
  );
}

/**
 * Date range display with custom styling for start and end dates
 */
export function StyledDateRange({ 
  startDate, 
  endDate, 
  separator = ' - ',
  startClassName = '',
  endClassName = '',
  separatorClassName = 'text-muted-foreground',
  className,
  ...props 
}: DateRangeDisplayProps & {
  startClassName?: string;
  endClassName?: string;
  separatorClassName?: string;
}) {
  return (
    <DateRangeDisplay 
      startDate={startDate}
      endDate={endDate}
      separator={separator}
      className={className}
      renderCustom={(start, end, sep) => (
        <>
          <span className={startClassName}>{start}</span>
          <span className={separatorClassName}>{sep}</span>
          <span className={endClassName}>{end}</span>
        </>
      )}
      {...props} 
    />
  );
}