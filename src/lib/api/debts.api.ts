import { apiClient } from './client';
import { adaptDebtsListResponse, adaptItemResponse, adaptMutationResponse, adaptSimpleListResponse } from './adapters';
import type { ListResponse, ItemResponse, MutationResponse } from './adapters';

export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'CLEARED';

export interface DebtSummary {
  totalOutstanding: number;
  activeDebtors: number;
  weeklyPaymentAmount: number;
}

export interface DebtFilters {
  search?: string;
  status?: DebtStatus;
  page?: number;
  limit?: number;
}

export interface CustomerDebtSummary {
  customerId: string;
  customerName: string;
  status: DebtStatus;
  currentBalance: number;
  lastPaymentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DebtTransactionItem {
  id: string;
  type: 'DEBT_CREATED' | 'PAYMENT_RECORDED' | 'DEBT_ADJUSTED';
  amount: number;
  balanceAfter: number;
  date: string;
  description?: string | null;
  notes?: string | null;
  userName?: string | null;
}

export interface CustomerDebtDetail extends CustomerDebtSummary {
  transactions: DebtTransactionItem[];
}

export interface CreateDebtRequest {
  amount: number;
  description?: string;
  date?: string; // ISO
  notes?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  date?: string; // ISO
  description?: string;
  notes?: string;
}

export interface PaymentHistoryFilters {
  from?: string; // ISO
  to?: string;   // ISO
  customerId?: string;
  min?: number;
  max?: number;
}

export interface PaymentHistoryItem {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  remaining: number;
  date: string;
  userName?: string | null;
  description?: string | null;
  notes?: string | null;
}

export const debtsApi = {
  async getSummary(): Promise<ItemResponse<DebtSummary>> {
    const resp = await apiClient.get('/debts/summary');
    return adaptItemResponse<DebtSummary>(resp);
  },

  async listCustomerDebts(filters: DebtFilters = {}): Promise<ListResponse<CustomerDebtSummary>> {
    const params: Record<string, unknown> = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const resp = await apiClient.get('/debts/customers', { params });
    return adaptDebtsListResponse<CustomerDebtSummary>(resp, { page: filters.page, limit: filters.limit });
  },

  async getCustomerDebtDetail(customerId: string): Promise<ItemResponse<CustomerDebtDetail | null>> {
    const resp = await apiClient.get(`/debts/customers/${customerId}`);
    return adaptItemResponse<CustomerDebtDetail | null>(resp);
  },

  async createDebt(customerId: string, body: CreateDebtRequest): Promise<MutationResponse<unknown>> {
    const resp = await apiClient.post(`/debts/customers/${customerId}/debts`, body);
    return adaptMutationResponse(resp);
  },

  async recordPayment(customerId: string, body: RecordPaymentRequest): Promise<MutationResponse<unknown>> {
    const resp = await apiClient.post(`/debts/customers/${customerId}/payments`, body);
    return adaptMutationResponse(resp);
  },

  async listPaymentHistory(filters: PaymentHistoryFilters = {}): Promise<ListResponse<PaymentHistoryItem>> {
    const params: Record<string, unknown> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.min != null) params.min = filters.min;
    if (filters.max != null) params.max = filters.max;

    const resp = await apiClient.get('/debts/payments', { params });
    return adaptSimpleListResponse<PaymentHistoryItem>(resp);
  },
};
