/**
 * API Module Index
 * 
 * Central export for all API modules.
 */

export * from "./client";
export { authApi } from "./auth.api";
export { customersApi } from "./customers.api";
export { salesApi } from "./sales.api";
export { settingsApi } from "./settings.api";
export { usersApi } from "./users.api";
export { paymentsApi, reminderNotesApi } from "./payments.api";
export { remindersApi } from "./reminders.api";

// Re-export common types
export type { LoginRequest, LoginResponse, RegisterRequest } from "./auth.api";
export type { CreateCustomerRequest, UpdateCustomerRequest, CustomerFilters, CustomerStats } from "./customers.api";
export type { CreateSaleRequest, UpdateSaleRequest, SaleFilters, DailySalesTrend, LocationPerformance, SalesSummary } from "./sales.api";
export type { Setting, CreateSettingRequest, UpdateSettingRequest } from "./settings.api";
export type { User, CreateUserRequest, UpdateUserRequest, UserStats } from "./users.api";
export type { PaginatedResponse } from "./customers.api";
export type { 
  CreatePaymentRequest, 
  RecordPaymentRequest, 
  UpdatePaymentRequest, 
  PaymentFilters, 
  CreateReminderNoteRequest,
  AgingReport,
  DailyPaymentsReport 
} from "./payments.api";
export type {
  BulkReminderNotesRequest,
  ReminderFilters,
  CustomerNeedingReminder,
  ReminderStats
} from "./reminders.api";
