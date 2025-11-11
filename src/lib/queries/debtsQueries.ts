import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsApi, handleApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DebtHistoryFilters, PaginatedDebtTransactions } from '@/lib/types';
import { toast } from 'sonner';

// Queries
export function useDebtSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.debts.summary(),
    queryFn: debtsApi.getSummary,
    staleTime: 30_000,
  });
}

export function useCustomerDebtQuery(customerId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.debts.customer(customerId),
    queryFn: () => debtsApi.getCustomerDebt(customerId),
    enabled: !!customerId && enabled,
    staleTime: 15_000,
  });
}

export function useCustomerDebtHistoryQuery(customerId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.debts.customerHistory(customerId),
    queryFn: () => debtsApi.getCustomerDebtHistory(customerId),
    enabled: !!customerId && enabled,
    staleTime: 60_000,
  });
}

export function useDebtTransactionsQuery(filters: DebtHistoryFilters) {
  // Convert filters to a record for query key safety
  const keyFilters: Record<string, unknown> = { ...filters };
  return useQuery<PaginatedDebtTransactions>({
    queryKey: queryKeys.debts.transactions(keyFilters),
    queryFn: () => debtsApi.getTransactionHistory(filters),
    staleTime: 15_000,
  });
}

export function useDebtMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.debts.metrics(),
    queryFn: debtsApi.getMetrics,
    staleTime: 30_000,
  });
}

// Mutations with optimistic updates
export function useChargeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.createCharge,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.debts.customer(payload.customerId) });
      const previous = qc.getQueryData(queryKeys.debts.customer(payload.customerId));
      // naive optimistic update: increment balance if exists
      // Skip complex optimistic math for now; rely on invalidate
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.debts.customer(vars.customerId), ctx.previous);
      }
      const apiErr = handleApiError(err);
      toast.error(`Charge failed: ${apiErr.message}`);
    },
    onSuccess: (_data, vars) => {
      toast.success('Charge recorded');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customer(vars.customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.metrics() });
    },
  });
}

export function usePaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.createPayment,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.debts.customer(payload.customerId) });
      const previous = qc.getQueryData(queryKeys.debts.customer(payload.customerId));
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.debts.customer(vars.customerId), ctx.previous);
      toast.error(`Payment failed: ${handleApiError(err).message}`);
    },
    onSuccess: (_d, v) => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customer(v.customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.metrics() });
    },
  });
}

export function useAdjustmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.createAdjustment,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.debts.customer(payload.customerId) });
      const previous = qc.getQueryData(queryKeys.debts.customer(payload.customerId));
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.debts.customer(vars.customerId), ctx.previous);
      toast.error(`Adjustment failed: ${handleApiError(err).message}`);
    },
    onSuccess: (_d, v) => {
      toast.success('Adjustment recorded');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customer(v.customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.metrics() });
    },
  });
}

export function useMarkPaidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: debtsApi.markPaid,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.debts.customer(payload.customerId) });
      const previous = qc.getQueryData(queryKeys.debts.customer(payload.customerId));
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.debts.customer(vars.customerId), ctx.previous);
      toast.error(`Close tab failed: ${handleApiError(err).message}`);
    },
    onSuccess: (_d, v) => {
      toast.success('Debt tab closed');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customer(v.customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.metrics() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.transactions() });
    },
  });
}
