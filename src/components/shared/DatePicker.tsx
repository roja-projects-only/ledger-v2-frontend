/**
 * DatePicker Component - Standardized date picker using shadcn/ui Calendar
 * 
 * Features:
 * - Consistent date picker interface across the application
 * - Built on shadcn/ui Calendar component with Popover
 * - Proper date validation and boundary checking
 * - Keyboard navigation and accessibility support
 * - Error states and user feedback
 * - Timezone-aware date handling (Asia/Manila)
 */

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  formatDate, 
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

// ============================================================================
// Component Props
// ============================================================================

export interface DatePickerProps {
  /** Currently selected date */
  value?: Date;
  /** Callback when date changes */
  onChange: (date: Date | undefined) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
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
}

// ============================================================================
// DatePicker Component
// ============================================================================

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  popoverClassName,
  error = false,
  errorMessage,
  ariaLabel,
  showIcon = true,
  variant = "outline",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Format the selected date for display
  const displayValue = value ? formatDate(toLocalISODate(value)) : placeholder;

  // Create disabled date matcher function
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Ensure the date is in Manila timezone
      const manilaDate = createManilaDate(toLocalISODate(selectedDate));
      onChange(manilaDate);
    } else {
      onChange(undefined);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            disabled={disabled}
            aria-label={ariaLabel || `Date picker, ${value ? `selected date is ${displayValue}` : 'no date selected'}`}
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
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {/* Error message */}
      {error && errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * DatePicker with today as maximum date (no future dates)
 */
export function PastDatePicker({ 
  maxDate = new Date(), 
  ...props 
}: Omit<DatePickerProps, 'maxDate'> & { maxDate?: Date }) {
  return (
    <DatePicker 
      maxDate={maxDate}
      {...props} 
    />
  );
}

/**
 * DatePicker with today as minimum date (no past dates)
 */
export function FutureDatePicker({ 
  minDate = new Date(), 
  ...props 
}: Omit<DatePickerProps, 'minDate'> & { minDate?: Date }) {
  return (
    <DatePicker 
      minDate={minDate}
      {...props} 
    />
  );
}

/**
 * Compact DatePicker without icon
 */
export function CompactDatePicker({ 
  showIcon = false, 
  variant = "ghost" as const,
  ...props 
}: DatePickerProps) {
  return (
    <DatePicker 
      showIcon={showIcon}
      variant={variant}
      {...props} 
    />
  );
}

/**
 * DatePicker with validation
 */
export interface ValidatedDatePickerProps extends DatePickerProps {
  /** Validation function that returns error message or null */
  validate?: (date: Date | undefined) => string | null;
}

export function ValidatedDatePicker({ 
  validate, 
  onChange, 
  ...props 
}: ValidatedDatePickerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (date: Date | undefined) => {
    const validationError = validate ? validate(date) : null;
    setError(validationError);
    onChange(date);
  };

  return (
    <DatePicker 
      onChange={handleChange}
      error={!!error}
      errorMessage={error || undefined}
      {...props} 
    />
  );
}