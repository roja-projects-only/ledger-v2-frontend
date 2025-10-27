/**
 * DateRangePicker Component - Standardized date range selection
 * 
 * Features:
 * - Date range selection with start/end date validation
 * - Maximum range validation and user feedback
 * - Visual indicators for selected date ranges
 * - Keyboard navigation and accessibility support
 * - Error states and validation messages
 * - Timezone-aware date handling (Asia/Manila)
 */

import { useState, useMemo } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  formatDateRange, 
  validateDateRange, 
  createManilaDate,
  toLocalISODate 
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// ============================================================================
// Component Props
// ============================================================================

export interface DateRangePickerProps {
  /** Currently selected start date */
  startDate?: Date;
  /** Currently selected end date */
  endDate?: Date;
  /** Callback when start date changes */
  onStartDateChange: (date: Date | undefined) => void;
  /** Callback when end date changes */
  onEndDateChange: (date: Date | undefined) => void;
  /** Maximum range in days */
  maxRange?: number;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Placeholder text when no dates are selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the trigger button */
  className?: string;
  /** Additional CSS classes for the popover content */
  popoverClassName?: string;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Whether to show the calendar icon */
  showIcon?: boolean;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Separator between dates in display */
  separator?: string;
}

// ============================================================================
// DateRangePicker Component
// ============================================================================

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  maxRange,
  minDate,
  maxDate,
  placeholder = "Select date range",
  disabled = false,
  className,
  popoverClassName,
  error = false,
  errorMessage,
  ariaLabel,
  showIcon = true,
  variant = "outline",
  separator = " - ",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<'start' | 'end'>('start');

  // Format the selected date range for display
  const displayValue = useMemo(() => {
    if (startDate && endDate) {
      const startISO = toLocalISODate(startDate);
      const endISO = toLocalISODate(endDate);
      return formatDateRange(startISO, endISO, separator);
    } else if (startDate) {
      return `${toLocalISODate(startDate)}${separator}...`;
    } else if (endDate) {
      return `...${separator}${toLocalISODate(endDate)}`;
    }
    return placeholder;
  }, [startDate, endDate, separator, placeholder]);

  // Validate the current range
  const rangeValidation = useMemo(() => {
    if (!startDate || !endDate) return { isValid: true };
    
    const startISO = toLocalISODate(startDate);
    const endISO = toLocalISODate(endDate);
    
    const validation = validateDateRange(startISO, endISO);
    if (!validation.isValid) return validation;

    // Check maximum range if specified
    if (maxRange) {
      const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffInDays > maxRange) {
        return {
          isValid: false,
          error: `Date range cannot exceed ${maxRange} days`
        };
      }
    }

    return { isValid: true };
  }, [startDate, endDate, maxRange]);

  // Create disabled date matcher function
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    // If we're selecting end date and have a start date, enforce max range
    if (activeInput === 'end' && startDate && maxRange) {
      const maxEndDate = new Date(startDate);
      maxEndDate.setDate(maxEndDate.getDate() + maxRange);
      if (date > maxEndDate) return true;
    }
    
    // If we're selecting start date and have an end date, enforce max range
    if (activeInput === 'start' && endDate && maxRange) {
      const minStartDate = new Date(endDate);
      minStartDate.setDate(minStartDate.getDate() - maxRange);
      if (date < minStartDate) return true;
    }
    
    return false;
  };

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const manilaDate = createManilaDate(toLocalISODate(selectedDate));

    if (activeInput === 'start') {
      onStartDateChange(manilaDate);
      // Auto-switch to end date selection if we don't have an end date
      if (!endDate) {
        setActiveInput('end');
      } else {
        setOpen(false);
      }
    } else {
      onEndDateChange(manilaDate);
      setOpen(false);
    }
  };

  // Handle clearing dates
  const handleClear = () => {
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    setActiveInput('start');
  };

  const hasError = error || !rangeValidation.isValid;
  const displayErrorMessage = errorMessage || rangeValidation.error;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            className={cn(
              "w-full justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground",
              hasError && "border-destructive focus-visible:ring-destructive",
              className
            )}
            disabled={disabled}
            aria-label={ariaLabel || `Date range picker, ${startDate && endDate ? `selected range is ${displayValue}` : 'no range selected'}`}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn("w-auto p-0", popoverClassName)} 
          align="start"
        >
          <div className="p-3 space-y-3">
            {/* Date selection tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-md">
              <Button
                variant={activeInput === 'start' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setActiveInput('start')}
              >
                Start Date
              </Button>
              <Button
                variant={activeInput === 'end' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setActiveInput('end')}
              >
                End Date
              </Button>
            </div>

            {/* Current selection display */}
            <div className="text-sm text-muted-foreground text-center">
              {activeInput === 'start' ? 'Select start date' : 'Select end date'}
              {startDate && endDate && (
                <div className="mt-1 font-medium text-foreground">
                  {displayValue}
                </div>
              )}
            </div>

            <Separator />

            {/* Calendar */}
            <Calendar
              mode="single"
              selected={activeInput === 'start' ? startDate : endDate}
              onSelect={handleSelect}
              disabled={isDateDisabled}
              initialFocus
            />

            <Separator />

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!startDate && !endDate}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Error message */}
      {hasError && displayErrorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {displayErrorMessage}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * DateRangePicker with maximum 30-day range
 */
export function MonthlyDateRangePicker({ 
  maxRange = 30, 
  ...props 
}: Omit<DateRangePickerProps, 'maxRange'> & { maxRange?: number }) {
  return (
    <DateRangePicker 
      maxRange={maxRange}
      {...props} 
    />
  );
}

/**
 * DateRangePicker with maximum 7-day range
 */
export function WeeklyDateRangePicker({ 
  maxRange = 7, 
  ...props 
}: Omit<DateRangePickerProps, 'maxRange'> & { maxRange?: number }) {
  return (
    <DateRangePicker 
      maxRange={maxRange}
      {...props} 
    />
  );
}

/**
 * DateRangePicker that only allows past dates
 */
export function PastDateRangePicker({ 
  maxDate = new Date(), 
  ...props 
}: Omit<DateRangePickerProps, 'maxDate'> & { maxDate?: Date }) {
  return (
    <DateRangePicker 
      maxDate={maxDate}
      {...props} 
    />
  );
}

/**
 * Compact DateRangePicker without icon
 */
export function CompactDateRangePicker({ 
  showIcon = false, 
  variant = "ghost" as const,
  ...props 
}: DateRangePickerProps) {
  return (
    <DateRangePicker 
      showIcon={showIcon}
      variant={variant}
      {...props} 
    />
  );
}