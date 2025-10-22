/**
 * Reminders API
 * 
 * Handles reminder notes CRUD operations and overdue customer tracking.
 */

import { apiClient } from "./client";
import type { ReminderNote, Customer } from "@/lib/types";
import { 
  adaptItemResponse
} from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface CreateReminderNoteRequest {
  customerId: string;
  note: string;
  reminderDate?: string; // ISO 8601 date string
}

export interface BulkReminderNotesRequest {
  customerIds: string[];
  note: string;
}

export interface ReminderFilters {
  customerId?: string;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
  page?: number;
  limit?: number;
}

export interface CustomerNeedingReminder extends Customer {
  lastReminderDate?: string; // ISO 8601 date string
  oldestDebtDate?: string; // ISO 8601 date string
  daysSinceLastReminder: number | null;
  daysPastDue?: number;
}

export interface ReminderStats {
  remindersToday: number;
  remindersThisWeek: number;
  customersWithDebt: number;
  customersNeedingReminders: number;
}

// ============================================================================
// Reminders API
// ============================================================================

export const remindersApi = {
  /**
   * List reminder notes with filters and pagination
   */
  list: async (filters?: ReminderFilters): Promise<{ reminders: ReminderNote[]; total: number }> => {
    const response = await apiClient.get("/reminders/notes", { params: filters });
    // Backend returns { reminders: [...], pagination: {...} }
    return {
      reminders: response.data.reminders || [],
      total: response.data.pagination?.total || 0,
    };
  },

  /**
   * Get reminder note by ID
   */
  get: async (id: string): Promise<ReminderNote> => {
    const response = await apiClient.get(`/reminders/notes/${id}`);
    return adaptItemResponse<ReminderNote>(response).data;
  },

  /**
   * Add reminder note for customer
   */
  create: async (data: CreateReminderNoteRequest): Promise<ReminderNote> => {
    const response = await apiClient.post("/reminders/notes", data);
    return adaptItemResponse<ReminderNote>(response).data;
  },

  /**
   * Delete reminder note (admin only)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reminders/notes/${id}`);
  },

  /**
   * Get customer reminder history
   */
  getCustomerReminders: async (customerId: string, page: number = 1, limit: number = 50): Promise<{ reminders: ReminderNote[]; total: number }> => {
    const response = await apiClient.get(`/customers/${customerId}/reminders`, {
      params: { page, limit }
    });
    // Backend returns { reminders: [...], pagination: {...} }
    return {
      reminders: response.data.reminders || [],
      total: response.data.pagination?.total || 0,
    };
  },

  /**
   * Get last reminder date for customer
   */
  getLastReminderDate: async (customerId: string): Promise<string | null> => {
    const response = await apiClient.get(`/customers/${customerId}/last-reminder`);
    // Backend returns { customerId, lastReminderDate, retrievedAt }
    return response.data.lastReminderDate || null;
  },

  /**
   * Get customers needing reminders (overdue)
   */
  getCustomersNeedingReminders: async (daysSinceLastReminder: number = 7): Promise<CustomerNeedingReminder[]> => {
    const response = await apiClient.get("/reminders/overdue", {
      params: { days: daysSinceLastReminder }
    });
    // Backend returns { customers: [...], totalCustomers, daysSinceLastReminder, retrievedAt }
    return response.data.customers || [];
  },

  /**
   * Get overdue customers (customers with debt older than specified days)
   */
  getOverdueCustomers: async (daysPastDue: number = 30): Promise<CustomerNeedingReminder[]> => {
    const response = await apiClient.get("/reminders/overdue-customers", {
      params: { days: daysPastDue }
    });
    // Backend returns { customers: [...], totalCustomers, daysPastDue, retrievedAt }
    return response.data.customers || [];
  },

  /**
   * Get reminder statistics
   */
  getStats: async (): Promise<ReminderStats> => {
    const response = await apiClient.get("/reminders/stats");
    return adaptItemResponse<ReminderStats>(response).data;
  },

  /**
   * Bulk add reminder notes for multiple customers
   */
  bulkCreate: async (data: BulkReminderNotesRequest): Promise<{ reminders: ReminderNote[]; message: string }> => {
    const response = await apiClient.post("/reminders/bulk", data);
    // Backend returns { message, reminders: [...] }
    return {
      reminders: response.data.reminders || [],
      message: response.data.message || "Reminder notes created successfully",
    };
  },
};
