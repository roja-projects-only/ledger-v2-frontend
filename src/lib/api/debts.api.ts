import { apiClient } from './client';
import { adaptItemResponse, adaptMutationResponse } from './adapters';
import type {
  DebtTab,
  DebtTransaction,
  DebtSummaryItem,
  DebtHistoryFilters,
  PaginatedDebtTransactions,
  DebtMetrics,
} from '@/lib/types';

// Adapter for summary list (simple array)
function adaptDebtSummary(response: unknown): DebtSummaryItem[] {
  const r = response as { data: DebtSummaryItem[] };
  return r.data;
}

// Adapter for transactions with pagination
function adaptPaginatedTransactions(response: unknown): PaginatedDebtTransactions {
  const r = response as { data: DebtTransaction[]; pagination: PaginatedDebtTransactions['pagination'] };
  return {
    data: r.data,
    pagination: r.pagination,
  };
}

export const debtsApi = {
  // GET /api/debts/summary
  getSummary: async (): Promise<DebtSummaryItem[]> => {
    const res = await apiClient.get('/debts/summary');
    return adaptDebtSummary(res);
  },

  // GET /api/debts/customer/:customerId
  getCustomerDebt: async (customerId: string): Promise<{ customer: unknown; tab: DebtTab | null; transactions: DebtTransaction[] }> => {
    const res = await apiClient.get(`/debts/customer/${customerId}`);
    return adaptItemResponse<{ customer: unknown; tab: DebtTab | null; transactions: DebtTransaction[] }>(res).data;
  },

  // GET /api/debts/customer/:customerId/history
  getCustomerDebtHistory: async (customerId: string): Promise<{ tabs: DebtTab[]; transactions: DebtTransaction[] }> => {
    const res = await apiClient.get(`/debts/customer/${customerId}/history`);
    return adaptItemResponse<{ tabs: DebtTab[]; transactions: DebtTransaction[] }>(res).data;
  },

  // GET /api/debts/transactions
  getTransactionHistory: async (filters: DebtHistoryFilters): Promise<PaginatedDebtTransactions> => {
    const res = await apiClient.get('/debts/transactions', { params: filters });
    return adaptPaginatedTransactions(res);
  },

  // POST /api/debts/charge
  createCharge: async (payload: { customerId: string; containers: number; transactionDate: string; notes?: string }) => {
    const res = await apiClient.post('/debts/charge', payload);
    return adaptMutationResponse(res).data as { transaction: DebtTransaction; tab: DebtTab };
  },

  // POST /api/debts/payment
  createPayment: async (payload: { customerId: string; amount: number; transactionDate: string; notes?: string }) => {
    const res = await apiClient.post('/debts/payment', payload);
    return adaptMutationResponse(res).data as { transaction: DebtTransaction; tab: DebtTab };
  },

  // POST /api/debts/adjustment
  createAdjustment: async (payload: { customerId: string; amount: number; reason: string; transactionDate: string; notes?: string }) => {
    const res = await apiClient.post('/debts/adjustment', payload);
    return adaptMutationResponse(res).data as { transaction: DebtTransaction; tab: DebtTab };
  },

  // POST /api/debts/mark-paid
  markPaid: async (payload: { customerId: string; finalPayment?: number; transactionDate: string }) => {
    const res = await apiClient.post('/debts/mark-paid', payload);
    return adaptMutationResponse(res).data as { transaction?: DebtTransaction; tab: DebtTab };
  },

  // GET /api/debts/metrics
  getMetrics: async (): Promise<DebtMetrics> => {
    const res = await apiClient.get('/debts/metrics');
    return adaptItemResponse<DebtMetrics>(res).data;
  },
};
