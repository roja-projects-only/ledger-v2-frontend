/**
 * Enhanced date/time utilities for consistent formatting and calculations
 */

import {
  format,
  parseISO,
  isValid as isValidDate,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  addDays,
} from "date-fns";
import { defaultDateConfig } from "../dateConfig";

export interface DateFormatOptions {
  includeTime?: boolean;
  includeYear?: boolean;
  relative?: boolean;
  timezone?: string;
}

export interface RelativeDateOptions {
  maxDays?: number; // Switch to absolute after this many days
  includeTime?: boolean;
}

/**
 * Safely apply a formatter to an ISO string, falling back on error
 */
export function safeDateFormat(
  iso: string,
  formatter: (d: Date) => string,
  fallback: string = iso
): string {
  try {
    const d = parseISO(iso);
    if (!isValidDate(d)) return fallback;
    return formatter(d);
  } catch {
    return fallback;
  }
}

/**
 * Convert a Date or ISO string to YYYY-MM-DD for a target timezone
 * Uses Intl timeZone conversion and constructs the date-only string.
 */
export function toISODateInTZ(date: Date | string, tz: string = defaultDateConfig.timezone): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const parts = new Date(d).toLocaleString("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour12: false,
  });
  // en-CA => YYYY-MM-DD, HH:MM:SS -> take date-only portion
  const dateOnly = parts.split(",")[0]?.trim();
  return dateOnly || d.toISOString().split("T")[0];
}

/**
 * Relative date formatting like "just now", "2 hours ago", or falls back to absolute
 */
export function formatRelativeDate(isoDate: string, options: RelativeDateOptions = {}): string {
  const { maxDays = defaultDateConfig.relativeThresholdDays, includeTime = false } = options;
  const now = new Date();
  const target = parseISO(isoDate);
  if (!isValidDate(target)) return isoDate;

  const days = Math.abs(differenceInDays(now, target));
  if (days > maxDays) {
    return format(target, includeTime ? defaultDateConfig.dateTimeFormat : defaultDateConfig.dateFormat);
  }

  const mins = differenceInMinutes(now, target);
  const absMins = Math.abs(mins);
  if (absMins < 1) return "just now";
  if (absMins < 60) return mins >= 0 ? `${absMins} min ago` : `in ${absMins} min`;

  const hours = differenceInHours(now, target);
  const absHours = Math.abs(hours);
  if (absHours < 24) return hours >= 0 ? `${absHours} hour${absHours === 1 ? "" : "s"} ago` : `in ${absHours} hour${absHours === 1 ? "" : "s"}`;

  const absDays = Math.abs(differenceInDays(now, target));
  return hours >= 0 ? `${absDays} day${absDays === 1 ? "" : "s"} ago` : `in ${absDays} day${absDays === 1 ? "" : "s"}`;
}

/**
 * Format a date range label with smart elision (year/month)
 */
export function formatDateRange(startISO: string, endISO: string, separator = " - "): string {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!isValidDate(start) || !isValidDate(end)) return `${startISO}${separator}${endISO}`;

  const fmt = (d: Date, pattern: string) => format(d, pattern);

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return fmt(start, defaultDateConfig.dateFormat);
  }

  // Same year
  if (start.getFullYear() === end.getFullYear()) {
    const left = fmt(start, "MMM dd");
    const right = fmt(end, defaultDateConfig.dateFormat);
    return `${left}${separator}${right}`;
  }

  // Different year
  return `${fmt(start, defaultDateConfig.dateFormat)}${separator}${fmt(end, defaultDateConfig.dateFormat)}`;
}

/**
 * Create a compact period label from Dates
 */
export function getDatePeriodLabel(startDate: Date, endDate: Date): string {
  return formatDateRange(startDate.toISOString(), endDate.toISOString());
}

/**
 * Check if a date (ISO) falls within [startISO, endISO] inclusively
 */
export function isWithinPeriod(dateISO: string, startISO: string, endISO: string): boolean {
  const d = parseISO(dateISO);
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!isValidDate(d) || !isValidDate(s) || !isValidDate(e)) return false;
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
}

/**
 * Count business days between two dates (inclusive), excluding configured holidays
 */
export function getBusinessDaysInPeriod(start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (endMs < startMs) return 0;

  const business = new Set(defaultDateConfig.businessDays);
  const holidaySet = new Set(defaultDateConfig.holidays);

  let count = 0;
  for (let d = new Date(start); d.getTime() <= endMs; d = addDays(d, 1)) {
    const day = d.getDay();
    const iso = d.toISOString().split("T")[0];
    if (business.has(day) && !holidaySet.has(iso)) count++;
  }
  return count;
}
