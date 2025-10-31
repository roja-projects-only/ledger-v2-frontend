/**
 * Utility functions for the Water Refilling Ledger application
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { CURRENCY_SYMBOL, DATE_FORMAT, DATETIME_FORMAT } from "./constants";

// ============================================================================
// Styling Utilities (from shadcn)
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Currency Formatting
// ============================================================================

/**
 * Format a number as currency (PHP)
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "\u20B112,345.67")
 */
export function formatCurrency(amount: number | undefined | null): string {
  const value = amount ?? 0;
  return `${CURRENCY_SYMBOL}${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse a currency string back to a number
 * @param currencyString - Currency string to parse (e.g., "\u20B112,345.67")
 * @returns Parsed number or 0 if invalid
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(new RegExp(`[${CURRENCY_SYMBOL},\\s]`, "g"), "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format an ISO date string for display
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string (e.g., "Oct 15, 2025")
 */
export function formatDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), DATE_FORMAT);
  } catch (error) {
    console.error("Failed to format date:", isoDate, error);
    return isoDate;
  }
}

/**
 * Format an ISO date string with time for display
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date-time string (e.g., "Oct 15, 2025 2:45 PM")
 */
export function formatDateTime(isoDate: string): string {
  try {
    return format(parseISO(isoDate), DATETIME_FORMAT);
  } catch (error) {
    console.error("Failed to format date-time:", isoDate, error);
    return isoDate;
  }
}

/**
 * Convert a Date object to an ISO date string (YYYY-MM-DD) using the local timezone
 * @param date - Date instance to convert
 * @returns ISO date string adjusted for local timezone
 */
export function toLocalISODate(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localMidnight = new Date(date.getTime() - offsetMs);
  return localMidnight.toISOString().split("T")[0];
}

/**
 * Get today's date in ISO format (YYYY-MM-DD) in the configured timezone
 * @returns ISO date string for today (Asia/Manila timezone)
 */
export function getTodayISO(): string {
  // Get current date in Asia/Manila timezone
  const now = new Date();
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const year = manilaDate.getFullYear();
  const month = String(manilaDate.getMonth() + 1).padStart(2, "0");
  const day = String(manilaDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current date-time in ISO format (Asia/Manila timezone)
 * @returns Full ISO 8601 date-time string
 */
export function getNowISO(): string {
  const now = new Date();
  const manilaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return manilaDate.toISOString();
}

/**
 * Check if a date string is today
 * @param isoDate - ISO 8601 date string
 * @returns True if date is today
 */
export function isToday(isoDate: string): boolean {
  const dateOnly = isoDate.split("T")[0];
  return dateOnly === getTodayISO();
}

/**
 * Format a date with relative time (e.g., "today", "yesterday", "2 days ago")
 * @param isoDate - ISO 8601 date string
 * @param options - Configuration options
 * @returns Relative date string or formatted date if beyond threshold
 */
export function formatRelativeDate(
  isoDate: string, 
  options: { maxDays?: number; includeTime?: boolean } = {}
): string {
  const { maxDays = 7, includeTime = false } = options;
  
  try {
    const date = parseISO(isoDate);
    const today = parseISO(getTodayISO());
    const diffInDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return includeTime ? `Today at ${format(date, 'h:mm a')}` : 'Today';
    } else if (diffInDays === 1) {
      return includeTime ? `Yesterday at ${format(date, 'h:mm a')}` : 'Yesterday';
    } else if (diffInDays > 1 && diffInDays <= maxDays) {
      const dayText = `${diffInDays} days ago`;
      return includeTime ? `${dayText} at ${format(date, 'h:mm a')}` : dayText;
    } else if (diffInDays < 0 && Math.abs(diffInDays) === 1) {
      return includeTime ? `Tomorrow at ${format(date, 'h:mm a')}` : 'Tomorrow';
    } else if (diffInDays < 0 && Math.abs(diffInDays) <= maxDays) {
      const dayText = `In ${Math.abs(diffInDays)} days`;
      return includeTime ? `${dayText} at ${format(date, 'h:mm a')}` : dayText;
    }
    
    // Beyond threshold, use standard formatting
    return includeTime ? formatDateTime(isoDate) : formatDate(isoDate);
  } catch (error) {
    console.error("Failed to format relative date:", isoDate, error);
    return formatDate(isoDate);
  }
}

/**
 * Format a date range with smart formatting
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @param separator - Separator between dates (default: " - ")
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string, 
  endDate: string, 
  separator: string = " - "
): string {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // Same day
    if (startDate.split('T')[0] === endDate.split('T')[0]) {
      return formatDate(startDate);
    }
    
    // Same year, optimize format
    if (start.getFullYear() === end.getFullYear()) {
      const startFormatted = format(start, 'MMM dd');
      const endFormatted = format(end, 'MMM dd, yyyy');
      return `${startFormatted}${separator}${endFormatted}`;
    }
    
    // Different years
    return `${formatDate(startDate)}${separator}${formatDate(endDate)}`;
  } catch (error) {
    console.error("Failed to format date range:", startDate, endDate, error);
    return `${formatDate(startDate)}${separator}${formatDate(endDate)}`;
  }
}

/**
 * Check if a date is within a specified number of days from today
 * @param isoDate - ISO 8601 date string
 * @param days - Number of days (positive for past, negative for future)
 * @returns True if date is within the specified range
 */
export function isWithinDays(isoDate: string, days: number): boolean {
  try {
    const date = parseISO(isoDate);
    const today = parseISO(getTodayISO());
    const diffInDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.abs(diffInDays) <= Math.abs(days);
  } catch (error) {
    console.error("Failed to check date within days:", isoDate, error);
    return false;
  }
}

/**
 * Check if a date is within a date range (inclusive)
 * @param date - Date to check (ISO string)
 * @param startDate - Range start date (ISO string)
 * @param endDate - Range end date (ISO string)
 * @returns True if date is within range
 */
export function isWithinPeriod(date: string, startDate: string, endDate: string): boolean {
  try {
    const checkDate = date.split('T')[0];
    const start = startDate.split('T')[0];
    const end = endDate.split('T')[0];
    
    return checkDate >= start && checkDate <= end;
  } catch (error) {
    console.error("Failed to check date within period:", date, startDate, endDate, error);
    return false;
  }
}

/**
 * Get the number of business days between two dates (excluding weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of business days
 */
export function getBusinessDaysInPeriod(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Create a Date object in Asia/Manila timezone for a given ISO date
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Date object adjusted for Asia/Manila timezone
 */
export function createManilaDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get yesterday's date in ISO format (Asia/Manila timezone)
 * @returns ISO date string for yesterday
 */
export function getYesterdayISO(): string {
  const today = createManilaDate(getTodayISO());
  today.setDate(today.getDate() - 1);
  return toLocalISODate(today);
}

/**
 * Get tomorrow's date in ISO format (Asia/Manila timezone)
 * @returns ISO date string for tomorrow
 */
export function getTomorrowISO(): string {
  const today = createManilaDate(getTodayISO());
  today.setDate(today.getDate() + 1);
  return toLocalISODate(today);
}

/**
 * Safe date formatting with error handling
 * @param date - Date string to format
 * @param formatter - Formatting function
 * @returns Formatted date or fallback
 */
export function safeDateFormat(
  date: string, 
  formatter: (date: string) => string
): string {
  try {
    return formatter(date);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return date; // Fallback to original
  }
}

// ============================================================================
// Date Validation Utilities
// ============================================================================

/**
 * Validate an ISO date string
 * @param dateString - Date string to validate
 * @returns Validation result with normalized date
 */
export function validateDate(dateString: string): { isValid: boolean; error?: string; normalizedDate?: string } {
  if (!dateString || typeof dateString !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }

  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    // Normalize to ISO date format (YYYY-MM-DD)
    const normalizedDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    
    return { 
      isValid: true, 
      normalizedDate 
    };
  } catch {
    return { 
      isValid: false, 
      error: 'Invalid date format' 
    };
  }
}

/**
 * Validate a date range
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Validation result with normalized range
 */
export function validateDateRange(
  startDate: string, 
  endDate: string
): { isValid: boolean; error?: string; normalizedRange?: { start: string; end: string } } {
  const startValidation = validateDate(startDate);
  const endValidation = validateDate(endDate);

  if (!startValidation.isValid) {
    return { isValid: false, error: `Start date: ${startValidation.error}` };
  }

  if (!endValidation.isValid) {
    return { isValid: false, error: `End date: ${endValidation.error}` };
  }

  if (startValidation.normalizedDate! > endValidation.normalizedDate!) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  return {
    isValid: true,
    normalizedRange: {
      start: startValidation.normalizedDate!,
      end: endValidation.normalizedDate!
    }
  };
}

/**
 * Check if a date is a valid business day (not weekend)
 * @param isoDate - ISO date string
 * @returns True if date is a business day
 */
export function isBusinessDay(isoDate: string): boolean {
  try {
    const date = createManilaDate(isoDate);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday (0) or Saturday (6)
  } catch (error) {
    console.error("Failed to check business day:", isoDate, error);
    return false;
  }
}

// ============================================================================
// Calculation Utilities
// ============================================================================

/**
 * Calculate total amount for a sale
 * @param quantity - Number of containers
 * @param unitPrice - Price per container
 * @returns Total amount (rounded to 2 decimal places)
 */
export function calculateTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Calculate average value
 * @param total - Total sum
 * @param count - Number of items
 * @returns Average value (rounded to 2 decimal places) or 0 if count is 0
 */
export function calculateAverage(total: number, count: number): number {
  if (count === 0) return 0;
  return Math.round((total / count) * 100) / 100;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID (timestamp-based with random suffix)
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate a 6-digit passcode
 * @param passcode - Passcode to validate
 * @returns True if valid (6 digits)
 */
export function isValidPasscode(passcode: string): boolean {
  return /^\d{6}$/.test(passcode);
}

/**
 * Validate an email address (for future use)
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate a string to a maximum length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

/**
 * Capitalize the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Sort an array by a property (ascending or descending)
 * @param array - Array to sort
 * @param key - Property key to sort by
 * @param direction - Sort direction
 * @returns Sorted array (new copy)
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Group an array by a property value
 * @param array - Array to group
 * @param key - Property key to group by
 * @returns Object with grouped arrays
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// ============================================================================
// Location Formatting
// ============================================================================

/**
 * Format location for display (replace underscores with spaces)
 * Backend stores: UPPER_LOOB, Display shows: Upper Loob
 * @param location - Location enum value
 * @returns Formatted location string
 */
export function formatLocation(location: string): string {
  return location.replace(/_/g, ' ');
}

// ============================================================================
// Enhanced Date Utilities (re-exports)
// ============================================================================

export * from "./utils/dateUtils";
