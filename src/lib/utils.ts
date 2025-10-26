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
