/**
 * RelativeTime Component - Auto-updating relative time display
 * 
 * Features:
 * - Auto-updating relative time display ("2 minutes ago", "just now")
 * - Configurable update intervals
 * - Fallback to absolute date after threshold
 * - Accessibility support with proper ARIA labels
 * - Performance optimized with cleanup on unmount
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  formatRelativeDate, 
  formatDateTime,
  validateDate,
  safeDateFormat 
} from "@/lib/utils";

// ============================================================================
// Component Props
// ============================================================================

export interface RelativeTimeProps {
  /** ISO date string to display */
  date: string;
  /** Update interval in milliseconds (default: 60000 = 1 minute) */
  updateInterval?: number;
  /** Maximum days to show relative format before switching to absolute */
  maxDays?: number;
  /** Fallback format when beyond maxDays threshold */
  fallbackFormat?: string;
  /** Additional CSS classes */
  className?: string;
  /** Fallback text when date is invalid */
  fallback?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Disable auto-updating (useful for testing or performance) */
  static?: boolean;
}

// ============================================================================
// RelativeTime Component
// ============================================================================

export function RelativeTime({
  date,
  updateInterval = 60000, // 1 minute default
  maxDays = 7,
  fallbackFormat,
  className,
  fallback = 'Invalid date',
  ariaLabel,
  static: isStatic = false,
}: RelativeTimeProps) {
  
  // State for triggering re-renders
  const [, setUpdateTrigger] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Validate the input date once
  const validation = useMemo(() => validateDate(date), [date]);

  // Set up auto-update interval
  useEffect(() => {
    if (isStatic || !validation.isValid) return;

    // Clear any existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = window.setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, updateInterval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateInterval, isStatic, validation.isValid]);

  // Format the relative time
  const formattedTime = useMemo(() => {
    if (!validation.isValid) {
      console.warn('RelativeTime: Invalid date provided:', date, validation.error);
      return fallback;
    }

    const normalizedDate = validation.normalizedDate!;

    // Try relative formatting first
    const relativeFormatted = safeDateFormat(normalizedDate, (d) => 
      formatRelativeDate(d, { 
        maxDays, 
        includeTime: false 
      })
    );

    // Check if we got a relative format or fell back to absolute
    // If the result contains common absolute date patterns, use fallback format
    const isAbsoluteFormat = /\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(relativeFormatted);
    
    if (isAbsoluteFormat && fallbackFormat) {
      // Use custom fallback format if provided
      return safeDateFormat(normalizedDate, formatDateTime);
    }

    return relativeFormatted;
  }, [date, validation, maxDays, fallback, fallbackFormat]);

  // Generate appropriate ARIA label
  const accessibilityLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    if (!validation.isValid) return 'Invalid date';
    
    // Always provide the full date for accessibility
    return safeDateFormat(validation.normalizedDate!, formatDateTime);
  }, [ariaLabel, validation]);

  return (
    <time 
      dateTime={date}
      aria-label={accessibilityLabel}
      className={cn(
        "inline-block",
        className
      )}
    >
      {formattedTime}
    </time>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Fast-updating relative time (updates every 30 seconds)
 */
export function FastRelativeTime({ 
  date, 
  className, 
  ...props 
}: Omit<RelativeTimeProps, 'updateInterval'>) {
  return (
    <RelativeTime 
      date={date} 
      updateInterval={30000} // 30 seconds
      className={className}
      {...props} 
    />
  );
}

/**
 * Slow-updating relative time (updates every 5 minutes)
 */
export function SlowRelativeTime({ 
  date, 
  className, 
  ...props 
}: Omit<RelativeTimeProps, 'updateInterval'>) {
  return (
    <RelativeTime 
      date={date} 
      updateInterval={300000} // 5 minutes
      className={className}
      {...props} 
    />
  );
}

/**
 * Static relative time (no auto-updates, good for lists)
 */
export function StaticRelativeTime({ 
  date, 
  className, 
  ...props 
}: Omit<RelativeTimeProps, 'static'>) {
  return (
    <RelativeTime 
      date={date} 
      static={true}
      className={className}
      {...props} 
    />
  );
}

/**
 * Relative time with short threshold (switches to absolute after 3 days)
 */
export function ShortRelativeTime({ 
  date, 
  className, 
  ...props 
}: Omit<RelativeTimeProps, 'maxDays'>) {
  return (
    <RelativeTime 
      date={date} 
      maxDays={3}
      className={className}
      {...props} 
    />
  );
}