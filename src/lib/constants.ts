/**
 * Application constants
 */

import { Location, type Settings, type DateConfig } from "./types";

// ============================================================================
// Business Constants
// ============================================================================

/**
 * List of all business locations (used in dropdowns, filters)
 */
export const LOCATIONS = [
  Location.BANAI,
  Location.DOUBE_L,
  Location.JOVIL_3,
  Location.LOWER_LOOB,
  Location.PINATUBO,
  Location.PLASTIKAN,
  Location.SAN_ISIDRO,
  Location.UPPER_LOOB,
  Location.URBAN,
  Location.WALK_IN,
  Location.ZUNIGA,
] as const;

/**
 * Default application settings
 */
export const DEFAULT_SETTINGS: Settings = {
  unitPrice: 23.0, // PHP per container
  currency: "PHP",
  businessName: undefined,
  enableCustomPricing: true, // Custom pricing enabled by default
  enableCreditFeature: true, // Credit feature enabled by default
  defaultCreditLimit: 1000.0, // PHP 1000 default credit limit
  daysBeforeOverdue: 30, // 30 days before debt is considered overdue
};

// ============================================================================
// localStorage Keys
// ============================================================================

/**
 * localStorage key prefix for namespacing
 */
const STORAGE_PREFIX = "ledger:";

/**
 * localStorage keys for data persistence
 */
export const STORAGE_KEYS = {
  CUSTOMERS: `${STORAGE_PREFIX}customers`,
  SALES: `${STORAGE_PREFIX}sales`,
  USERS: `${STORAGE_PREFIX}users`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  AUTH: `${STORAGE_PREFIX}auth`,
} as const;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Maximum number of users allowed (family operation)
 */
export const MAX_USERS = 3;

/**
 * Currency symbol for display
 */
export const CURRENCY_SYMBOL = "\u20B1";

/**
 * Date format for display (using date-fns)
 */
export const DATE_FORMAT = "MMM dd, yyyy";

/**
 * Date-time format for timestamps
 */
export const DATETIME_FORMAT = "MMM dd, yyyy h:mm a";

/**
 * Default timezone for the application (Asia/Manila)
 */
export const DEFAULT_TIMEZONE = "Asia/Manila";

/**
 * Passcode length
 */
export const PASSCODE_LENGTH = 6;

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Minimum unit price (PHP)
 */
export const MIN_UNIT_PRICE = 0.01;

/**
 * Maximum customer name length
 */
export const MAX_CUSTOMER_NAME_LENGTH = 100;

/**
 * Maximum business name length
 */
export const MAX_BUSINESS_NAME_LENGTH = 100;

/**
 * Maximum sale notes length
 */
export const MAX_SALE_NOTES_LENGTH = 500;

// ============================================================================
// Date Configuration Constants
// ============================================================================

/**
 * Default date configuration for the application
 */
export const DEFAULT_DATE_CONFIG: DateConfig = {
  timezone: DEFAULT_TIMEZONE,
  locale: "en-US",
  dateFormat: DATE_FORMAT,
  dateTimeFormat: DATETIME_FORMAT,
  relativeThreshold: 7, // Show relative dates for up to 7 days
  businessDays: [1, 2, 3, 4, 5], // Monday to Friday
  holidays: [], // No holidays configured by default
};

/**
 * Maximum days for relative date formatting
 */
export const MAX_RELATIVE_DAYS = 30;

/**
 * Date range presets in days
 */
export const DATE_RANGE_PRESETS = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
  LAST_YEAR: 365,
} as const;

/**
 * Maximum allowed date range in days
 */
export const MAX_DATE_RANGE_DAYS = 365;
