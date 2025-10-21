/**
 * Payments API
 * 
 * Handles payment CRUD operations, outstanding balances, and reminder notes.
 */

import { apiClient } from "./client";
import type { 
  Payment, 
  PaymentStatus, 
  PaymentMethod,
  ReminderNote, 
  OutstandingBalance
} from "@/lib/types";
import { 
  adaptItemResponse, 
  adaptMutationResponse,
  adaptSimpleListResponse 
} from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface CreatePaymentRequest {
  saleId: string;
  amount: number;
  dueDate?: string; // ISO 8601 date string
  notes?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  paidAt?: string; // ISO 8601 date string
  dueDate?: string; // ISO 8601 date string
  notes?: string;
}

export interface PaymentFilters {
  customerId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  page?: number;
  limit?: number;
}

export interface CreateReminderNoteRequest {
  customerId: string;
  note: string;
}

export interface AgingReport {
  summary: {
    totalOutstanding: number;
    totalCustomers: number;
    averageDebt: number;
  };
  aging: {
    current: { count: number; amount: number }; // 0-30 days
    thirtyDays: { count: number; amount: number }; // 31-60 days
    sixtyDays: { count: number; amount: number }; // 61-90 days
    ninetyDaysPlus: { count: number; amount: number }; // 90+ days
  };
}

export interface DailyPaymentsReport {
  date: string; // ISO 8601 date string
  totalPayments: number;
  totalAmount: number;
  paymentCount: number;
  payments: Payment[];
}

// ============================================================================
// Payments API
// ============================================================================

export const paymentsApi = {
  /**
   * List payments with filters and pagination
   */
  list: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const response = await apiClient.get("/payments", { params: filters });
    return adaptSimpleListResponse<Payment>(response).data;
  },

  /**
   * Get payment by ID
   */
  get: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return adaptItemResponse<Payment>(response).data;
  },

  /**
   * Create new payment record (for credit sales)
   */
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post("/payments", data);
    return adaptItemResponse<Payment>(response).data;
  },

  /**
   * Record payment received (update existing payment)
   */
  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<Payment> => {
    const response = await apiClient.post(`/payments/${id}/record`, data);
    return adaptItemResponse<Payment>(response).data;
  },

  /**
   * Update payment
   */
  update: async (id: string, data: UpdatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.put(`/payments/${id}`, data);
    return adaptItemResponse<Payment>(response).data;
  },

  /**
   * Delete payment (admin only)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/payments/${id}`);
    adaptMutationResponse<null>(response);
  },

  /**
   * Get customer payment history
   */
  getCustomerPayments: async (customerId: string): Promise<Payment[]> => {
    const response = await apiClient.get(`/payments/customers/${customerId}/payments`);
    // Backend returns { payments: [...], pagination: {...} }
    return response.data.payments || [];
  },

  /**
   * Get customer outstanding balance
   */
  getCustomerOutstanding: async (customerId: string): Promise<OutstandingBalance> => {
    const response = await apiClient.get(`/payments/customers/${customerId}/outstanding`);
    // Backend returns { customerId, outstandingBalance, calculatedAt }
    // We need to transform this to match our OutstandingBalance interface
    const data = response.data;
    return {
      customerId: data.customerId,
      customerName: "", // Will need to be fetched separately or included in backend response
      location: "URBAN", // Default, should be included in backend response
      totalOwed: data.outstandingBalance,
      oldestDebtDate: new Date().toISOString(), // Should be included in backend response
      daysPastDue: 0, // Should be calculated in backend
      creditLimit: 0, // Should be included in backend response
      collectionStatus: "ACTIVE", // Should be included in backend response
      lastPaymentDate: undefined, // Should be included in backend response
    };
  },

  /**
   * Get all customers with outstanding balances
   */
  getOutstandingBalances: async (): Promise<OutstandingBalance[]> => {
    const response = await apiClient.get("/payments/outstanding");
    // Backend returns { customers: [...], totalCustomers, totalOutstanding, retrievedAt }
    // We need to extract the customers array
    return response.data.customers || [];
  },

  /**
   * Get aging report
   */
  getAgingReport: async (): Promise<AgingReport> => {
    const response = await apiClient.get("/reports/aging");
    return adaptItemResponse<AgingReport>(response).data;
  },

  /**
   * Get daily payments report
   */
  getDailyPaymentsReport: async (date: string): Promise<DailyPaymentsReport> => {
    const response = await apiClient.get("/reports/payments/daily", { 
      params: { date } 
    });
    return adaptItemResponse<DailyPaymentsReport>(response).data;
  },
};

// ============================================================================
// Reminder Notes API
// ============================================================================

export const reminderNotesApi = {
  /**
   * Add reminder note for customer
   */
  create: async (data: CreateReminderNoteRequest): Promise<ReminderNote> => {
    const response = await apiClient.post("/reminders/notes", data);
    return adaptItemResponse<ReminderNote>(response).data;
  },

  /**
   * Get customer reminder history
   */
  getCustomerReminders: async (customerId: string): Promise<ReminderNote[]> => {
    const response = await apiClient.get(`/customers/${customerId}/reminders`);
    return adaptSimpleListResponse<ReminderNote>(response).data;
  },

  /**
   * Get customers needing reminders (overdue)
   */
  getOverdueCustomers: async (daysSinceLastReminder: number = 7): Promise<OutstandingBalance[]> => {
    const response = await apiClient.get("/reminders/overdue", {
      params: { daysSinceLastReminder }
    });
    return adaptSimpleListResponse<OutstandingBalance>(response).data;
  },
};