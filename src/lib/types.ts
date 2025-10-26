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
// Payment & Credit Types
// ============================================================================

/**
 * Payment status for credit transactions
 */
export const PaymentStatus = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL", 
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  COLLECTION: "COLLECTION",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * Payment method types
 */
export const PaymentMethod = {
  CASH: "CASH",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/**
 * Payment type for sales
 */
export const PaymentType = {
  CASH: "CASH",
  CREDIT: "CREDIT",
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

/**
 * Collection status for customers
 */
export const CollectionStatus = {
  ACTIVE: "ACTIVE",
  OVERDUE: "OVERDUE", 
  SUSPENDED: "SUSPENDED",
} as const;

export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

/**
 * Payment entity - represents a payment record for credit sales
 */
export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;
  paidAt?: string; // ISO 8601 date string
  dueDate?: string; // ISO 8601 date string
  notes?: string;
  saleId: string;
  customerId: string;
  recordedById: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  
  // Relations
  sale?: Sale;
  customer?: Customer;
  recordedBy?: User;
}

/**
 * Reminder note entity - tracks customer payment reminders
 */
export interface ReminderNote {
  id: string;
  note: string;
  reminderDate: string; // ISO 8601 date string
  customerId: string;
  createdById: string;
  createdAt: string; // ISO 8601 date string
  
  // Relations
  customer?: Customer;
  createdBy?: User;
}

/**
 * Outstanding balance summary for customers with debt
 */
export interface OutstandingBalance {
  customerId: string;
  customerName: string;
  location: Location;
  totalOwed: number;
  oldestDebtDate: string; // ISO 8601 date string
  daysPastDue: number;
  creditLimit: number;
  collectionStatus: CollectionStatus;
  lastPaymentDate?: string; // ISO 8601 date string
}

// ============================================================================
// Reporting Types
// ============================================================================

export interface AgingReportSummary {
  totalCustomers: number;
  totalOutstanding: number;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
}

export interface AgingReportCustomer {
  customerId: string;
  customerName: string;
  location: Location;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  totalOwed: number;
  collectionStatus: CollectionStatus;
}

export interface AgingReportData {
  summary: AgingReportSummary;
  customers: AgingReportCustomer[];
  generatedAt: string; // ISO 8601 date string
}

export interface DailyPaymentsReportSummary {
  date: string; // ISO 8601 date string
  totalPayments: number;
  totalAmount: number;
  paymentMethods: Record<string, number>;
}

export interface DailyPaymentsReport {
  summary: DailyPaymentsReportSummary;
  payments: Payment[];
  generatedAt: string; // ISO 8601 date string
}

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
  creditLimit?: number; // Maximum amount customer can owe before credit is suspended
  outstandingBalance: number; // Current amount owed by customer
  lastPaymentDate?: string; // ISO 8601 date string of last payment
  collectionStatus: CollectionStatus; // Current collection status
  createdAt: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
  
  // Relations
  payments?: Payment[];
  reminderNotes?: ReminderNote[];
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
  paymentType: PaymentType; // Whether sale was cash or credit
  notes?: string; // Optional notes about the sale
  createdAt: string; // ISO 8601 date string (when entry was created)
  updatedAt?: string; // ISO 8601 date string (when entry was last updated)
  wasUpdated?: boolean; // Indicates if this was an update operation (upsert)
  
  // Relations
  payment?: Payment; // One-to-one relationship for credit sales
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
  enableCreditFeature: boolean; // Global toggle for credit/debt tracking feature
  defaultCreditLimit: number; // Default credit limit for new customers (in PHP)
  daysBeforeOverdue: number; // Number of days before debt is considered overdue
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
 * Authentication session - extends AuthState for future backend compatibility
 */
export interface AuthSession extends AuthState {
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
  creditLimit?: number; // Optional credit limit
  notes?: string; // Optional notes
}

/**
 * Form data for adding/editing a sale
 */
export interface SaleFormData {
  customerId: string;
  date: string; // ISO 8601 date string
  quantity: number;
  paymentType: PaymentType; // Cash or credit payment
  notes?: string;
}

/**
 * Form data for recording a payment
 */
export interface PaymentFormData {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Form data for adding a reminder note
 */
export interface ReminderNoteFormData {
  customerId: string;
  note: string;
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
