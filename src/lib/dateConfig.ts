/**
 * Centralized date/time configuration and types
 */

import { DATE_FORMAT, DATETIME_FORMAT, DEFAULT_TIMEZONE } from "./constants";

export interface DateConfig {
  timezone: string; // IANA timezone, e.g., "Asia/Manila"
  locale: string; // BCP 47 language tag
  dateFormat: string; // date-fns pattern
  dateTimeFormat: string; // date-fns pattern
  relativeThresholdDays: number; // switch from relative to absolute after N days
  businessDays: number[]; // 0-6 (Sunday=0)
  holidays: string[]; // ISO YYYY-MM-DD strings
}

export const defaultDateConfig: DateConfig = {
  timezone: DEFAULT_TIMEZONE,
  locale: navigator?.language ?? "en-US",
  dateFormat: DATE_FORMAT,
  dateTimeFormat: DATETIME_FORMAT,
  relativeThresholdDays: 7,
  businessDays: [1, 2, 3, 4, 5], // Mon-Fri
  holidays: [],
};
