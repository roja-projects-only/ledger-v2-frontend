/**
 * Payments API
 * 
 * Handles payment CRUD operations and outstanding balances.
 */

import { apiClient } from "./client";
import {
  CollectionStatus as CollectionStatusEnum,
  Location as LocationEnum,
} from "@/lib/types";
import type {
  AgingReportData,
  CollectionStatus,
  Customer,
  DailyPaymentsReport,
  Location,
  OutstandingBalance,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentSummary,
  PaymentTransaction,
  PaymentTransactionWithBalance,
} from "@/lib/types";
import {
  adaptItemResponse,
  adaptMutationResponse,
  adaptSimpleListResponse,
  asEnvelope,
} from "./adapters";
import type {
  ApiListPagination,
  ItemApiEnvelope,
  MutationApiEnvelope,
  SimpleListApiEnvelope,
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



export interface CreatePaymentTransactionRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface UpdatePaymentTransactionRequest {
  notes?: string;
}

interface CustomerPaymentsResponse {
  payments: Payment[];
  pagination?: ApiListPagination;
}

interface CustomerOutstandingApiResponse {
  customerId: string;
  outstandingBalance: number;
  calculatedAt?: string;
  customerName?: string;
  location?: Location;
  oldestDebtDate?: string;
  daysPastDue?: number;
  collectionStatus?: CollectionStatus;
  lastPaymentDate?: string;
  creditLimit?: number;
}

interface OutstandingBalancesResponse {
  customers: OutstandingBalance[];
  totalCustomers: number;
  totalOutstanding: number;
  retrievedAt: string;
}

interface PaymentTransactionsResponse {
  paymentId: string;
  transactions: PaymentTransactionWithBalance[];
  totalTransactions?: number;
  totalPaid?: number;
}

// ============================================================================
// Payments API
// ============================================================================

export const paymentsApi = {
  /**
   * List payments with filters and pagination
   */
  list: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const response = await apiClient.get<SimpleListApiEnvelope<Payment>>(
      "/payments",
      { params: filters }
    );
    return adaptSimpleListResponse<Payment>(
      asEnvelope<SimpleListApiEnvelope<Payment>>(response)
    ).data;
  },

  /**
   * Get payment by ID
   */
  get: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<ItemApiEnvelope<Payment>>(`/payments/${id}`);
    return adaptItemResponse<Payment>(asEnvelope<ItemApiEnvelope<Payment>>(response)).data;
  },

  /**
   * Create new payment record (for credit sales)
   */
  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ItemApiEnvelope<Payment>>("/payments", data);
    return adaptItemResponse<Payment>(asEnvelope<ItemApiEnvelope<Payment>>(response)).data;
  },

  /**
   * Record payment received (update existing payment)
   */
  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ItemApiEnvelope<Payment>>(
      `/payments/${id}/record`,
      data
    );
    return adaptItemResponse<Payment>(asEnvelope<ItemApiEnvelope<Payment>>(response)).data;
  },

  /**
   * Update payment
   */
  update: async (id: string, data: UpdatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.put<ItemApiEnvelope<Payment>>(`/payments/${id}`, data);
    return adaptItemResponse<Payment>(asEnvelope<ItemApiEnvelope<Payment>>(response)).data;
  },

  /**
   * Delete payment (admin only)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<MutationApiEnvelope<null>>(`/payments/${id}`);
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },

  /**
   * Get customer payment history
   */
  getCustomerPayments: async (customerId: string): Promise<Payment[]> => {
    const response = await apiClient.get<CustomerPaymentsResponse>(
      `/payments/customers/${customerId}/payments`
    );
    const data = asEnvelope<CustomerPaymentsResponse>(response);
    return data.payments ?? [];
  },

  /**
   * Get customer outstanding balance
   */
  getCustomerOutstanding: async (customerId: string): Promise<OutstandingBalance> => {
    const response = await apiClient.get<CustomerOutstandingApiResponse>(
      `/payments/customers/${customerId}/outstanding`
    );
    const data = asEnvelope<CustomerOutstandingApiResponse>(response);

    let customerCreditLimit = data.creditLimit ?? 1000;

    if (customerCreditLimit === 1000) {
      try {
        const customerResponse = await apiClient.get<ItemApiEnvelope<Customer>>(
          `/customers/${customerId}`
        );
        const customer = adaptItemResponse<Customer>(
          asEnvelope<ItemApiEnvelope<Customer>>(customerResponse)
        ).data;
        customerCreditLimit = customer.creditLimit ?? customerCreditLimit;
      } catch (error) {
        console.warn("Could not fetch customer credit limit, using default:", error);
      }
    }

    return {
      customerId: data.customerId,
      customerName: data.customerName ?? "",
      location: data.location ?? LocationEnum.URBAN,
      totalOwed: data.outstandingBalance,
      oldestDebtDate: data.oldestDebtDate ?? new Date().toISOString(),
      daysPastDue: data.daysPastDue ?? 0,
      creditLimit: customerCreditLimit,
      collectionStatus: data.collectionStatus ?? CollectionStatusEnum.ACTIVE,
      lastPaymentDate: data.lastPaymentDate,
    };
  },

  /**
   * Get all customers with outstanding balances
   */
  getOutstandingBalances: async (): Promise<OutstandingBalance[]> => {
    const response = await apiClient.get<OutstandingBalancesResponse>("/payments/outstanding");
    const data = asEnvelope<OutstandingBalancesResponse>(response);
    return data.customers ?? [];
  },

  /**
   * Get aging report
   */
  getAgingReport: async (): Promise<AgingReportData> => {
    const response = await apiClient.get<ItemApiEnvelope<AgingReportData>>(
      "/payments/reports/aging"
    );
    return adaptItemResponse<AgingReportData>(
      asEnvelope<ItemApiEnvelope<AgingReportData>>(response)
    ).data;
  },

  /**
   * Get daily payments report
   */
  getDailyPaymentsReport: async (date: string): Promise<DailyPaymentsReport> => {
    const response = await apiClient.get<ItemApiEnvelope<DailyPaymentsReport>>(
      "/payments/reports/payments/daily",
      {
        params: { date },
      }
    );
    return adaptItemResponse<DailyPaymentsReport>(
      asEnvelope<ItemApiEnvelope<DailyPaymentsReport>>(response)
    ).data;
  },

  /**
   * Get payment summary/KPIs
   */
  getPaymentSummary: async (): Promise<PaymentSummary> => {
    const response = await apiClient.get<ItemApiEnvelope<PaymentSummary>>(
      "/payments/summary"
    );
    return adaptItemResponse<PaymentSummary>(
      asEnvelope<ItemApiEnvelope<PaymentSummary>>(response)
    ).data;
  },

  /**
   * Create payment transaction (record partial or full payment)
   */
  createTransaction: async (paymentId: string, data: CreatePaymentTransactionRequest): Promise<Payment> => {
    const response = await apiClient.post<ItemApiEnvelope<Payment>>(
      `/payments/${paymentId}/transactions`,
      data
    );
    return adaptItemResponse<Payment>(asEnvelope<ItemApiEnvelope<Payment>>(response)).data;
  },

  /**
   * Get payment transactions with running balance
   */
  getTransactions: async (paymentId: string): Promise<PaymentTransactionWithBalance[]> => {
    const response = await apiClient.get<PaymentTransactionsResponse>(
      `/payments/${paymentId}/transactions`
    );
    const data = asEnvelope<PaymentTransactionsResponse>(response);
    return data.transactions ?? [];
  },

  /**
   * Update payment transaction notes
   */
  updateTransaction: async (transactionId: string, data: UpdatePaymentTransactionRequest): Promise<PaymentTransaction> => {
    const response = await apiClient.put<ItemApiEnvelope<PaymentTransaction>>(
      `/payments/transactions/${transactionId}`,
      data
    );
    return adaptItemResponse<PaymentTransaction>(
      asEnvelope<ItemApiEnvelope<PaymentTransaction>>(response)
    ).data;
  },

  /**
   * Delete payment transaction (admin only)
   */
  deleteTransaction: async (transactionId: string): Promise<void> => {
    const response = await apiClient.delete<MutationApiEnvelope<null>>(
      `/payments/transactions/${transactionId}`
    );
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },
};

