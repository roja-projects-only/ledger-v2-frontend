/**
 * TypeScript type definitions for the Water Refilling Ledger application
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// Constants & Types
// ============================================================================

/**
 * Fixed list of business locations (areas where customers are located)
 * CRITICAL: Must match backend Prisma enum exactly (uses underscores, not spaces)
 */
export const Location = {
  BANAI: "BANAI",
  DOUBE_L: "DOUBE_L",
  JOVIL_3: "JOVIL_3",
  LOWER_LOOB: "LOWER_LOOB",
  PINATUBO: "PINATUBO",
  PLASTIKAN: "PLASTIKAN",
  SAN_ISIDRO: "SAN_ISIDRO",
  UPPER_LOOB: "UPPER_LOOB",
  URBAN: "URBAN",
  WALK_IN: "WALK_IN",
  ZUNIGA: "ZUNIGA",
} as const;

export type Location = (typeof Location)[keyof typeof Location];

/**
 * KPI visual variant identifiers
 */
export type KPIVariant = "revenue" | "quantity" | "average" | "customers";

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Customer entity - represents a customer who purchases water
 */
export interface Customer {
  id: string;
  name: string;
  location: Location;
  phone?: string; // Optional phone number for contact
  customUnitPrice?: number; // Optional custom price per gallon (overrides global)
  notes?: string; // Optional additional notes about customer
  createdAt: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
}

/**
 * Sale entity - represents a single water sale transaction
 */
export interface Sale {
  id: string;
  userId: string; // ID of the user who created the sale
  customerId: string; // ID of the customer who made the purchase
  date: string; // ISO 8601 date string (date of sale)
  quantity: number; // Number of containers (gallons)
  unitPrice: number; // Price per container at time of sale
  total: number; // Total amount (quantity × unitPrice)
  notes?: string; // Optional notes about the sale
  createdAt: string; // ISO 8601 date string (when entry was created)
  updatedAt?: string; // ISO 8601 date string (when entry was last updated)
  wasUpdated?: boolean; // Indicates if this was an update operation (upsert)
}

/**
 * User entity - represents a system user (family member/staff)
 * Maximum 3 users for family operation
 */
export interface User {
  id: string;
  username: string; // Unique username for sign-in
  passcode: string; // For backward compatibility (not used with backend)
  role: "ADMIN" | "STAFF"; // User role
  active: boolean; // Account status
  createdAt: string; // ISO 8601 date string
}

/**
 * Settings entity - global application settings
 */
export interface Settings {
  unitPrice: number; // Default price per container (in PHP)
  currency: string; // Currency code (default: "PHP")
  businessName?: string; // Optional business name
  enableCustomPricing: boolean; // Global toggle for custom pricing feature
}

// ============================================================================
// Auth & Session
// ============================================================================

/**
 * Authentication state - current user session
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User;
}

/**
 * Auth credentials for sign-in
 */
export interface AuthCredentials {
  username: string;
  passcode: string; // 6-digit passcode
}

/**
 * Authentication session - alias for AuthState with future backend compatibility
 */
export type AuthSession = AuthState & {
  // Future backend fields:
  // token?: string;
  // refreshToken?: string;
  // expiresAt?: number;
}

/**
 * Authentication result - success or error response
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Authentication error types
 */
export type AuthErrorType = 
  | "invalid_credentials"
  | "user_not_found"
  | "invalid_format"
  | "no_users"
  | "network_error"
  | "unknown_error";

// ============================================================================
// UI & Display Types
// ============================================================================

/**
 * KPI (Key Performance Indicator) data for dashboard cards
 */
export interface KPI {
  label: string;
  value: string | number;
  icon?: LucideIcon; // Optional Lucide icon component
  trend?: "up" | "down" | "neutral"; // Optional trend indicator
  variant?: KPIVariant; // Optional visual variant for colored cards
}

/**
 * Date range for filtering/analysis
 */
export interface DateRange {
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
}

/**
 * Chart data point for sales by location
 */
export interface LocationSalesData {
  location: string;
  sales: number;
  containers: number;
}

/**
 * Chart data point for daily sales trend
 */
export interface DailySalesData {
  date: string; // Formatted date (e.g., "Oct 15")
  sales: number;
  containers: number;
}

/**
 * Chart data point for customer performance
 */
export interface CustomerPerformanceData {
  customer: string;
  sales: number;
  containers: number;
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Form data for adding/editing a customer
 */
export interface CustomerFormData {
  name: string;
  location: Location;
  phone?: string; // Optional phone number
  customUnitPrice?: number; // Optional custom price per gallon
  notes?: string; // Optional notes
}

/**
 * Form data for adding/editing a sale
 */
export interface SaleFormData {
  customerId: string;
  date: string; // ISO 8601 date string
  quantity: number;
  notes?: string;
}

// ============================================================================
// Debt Management Types
// ============================================================================

export type DebtStatus = 'OPEN' | 'CLOSED';
export type DebtTransactionType = 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';

export interface DebtTab {
  id: string;
  customerId: string;
  status: DebtStatus;
  totalBalance: number;
  openedAt: string; // ISO date
  closedAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface DebtTransaction {
  id: string;
  debtTabId: string;
  transactionType: DebtTransactionType;
  containers?: number; // For CHARGE
  unitPrice?: number; // For CHARGE pricing snapshot
  amount: number; // Positive numeric value (payment reduces balance via service logic)
  balanceAfter: number; // Resulting balance after transaction
  notes?: string;
  adjustmentReason?: string; // For ADJUSTMENT
  transactionDate: string; // ISO date
  enteredById: string; // User who entered it
  createdAt: string;
  updatedAt: string;
}

export interface DebtSummaryItem {
  customerId: string;
  customerName: string;
  balance: number;
  status: DebtStatus;
  openedAt: string;
  lastUpdated: string;
}

export interface DebtMetrics {
  totalOutstanding: number;
  totalPaymentsToday: number;
  activeCustomers: number;
}

export interface DebtHistoryFilters {
  customerId?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
  transactionType?: DebtTransactionType;
  status?: DebtStatus | 'ALL';
  page?: number;
  limit?: number;
}

export interface PaginatedDebtTransactions {
  data: DebtTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Form data for settings
 */
export interface SettingsFormData {
  unitPrice: number;
  businessName?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic API response wrapper (for future cloud sync)
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Pagination params (for future use)
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Sort params (for future use)
 */
export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}
