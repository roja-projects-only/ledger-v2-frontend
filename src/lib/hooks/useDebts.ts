import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { DebtSummaryItem, DebtHistoryFilters, DebtMetrics } from '@/lib/types';
import {
  useDebtSummaryQuery,
  useCustomerDebtQuery,
  useCustomerDebtHistoryQuery,
  useDebtTransactionsQuery,
  useDebtMetricsQuery,
  useChargeMutation,
  usePaymentMutation,
  useAdjustmentMutation,
  useMarkPaidMutation,
  invalidateDebtCaches,
} from '@/lib/queries/debtsQueries';

export function useDebts(customerId?: string) {
  const summaryQ = useDebtSummaryQuery();
  const customerDebtQ = useCustomerDebtQuery(customerId || '', !!customerId);
  const customerHistoryQ = useCustomerDebtHistoryQuery(customerId || '', !!customerId);
  const metricsQ = useDebtMetricsQuery();
  const queryClient = useQueryClient();

  const charge = useChargeMutation();
  const payment = usePaymentMutation();
  const adjustment = useAdjustmentMutation();
  const markPaid = useMarkPaidMutation();

  const summary: DebtSummaryItem[] = summaryQ.data ?? [];
  const customerDebt = useMemo(() => customerDebtQ.data ?? null, [customerDebtQ.data]);
  const customerHistory = useMemo(() => customerHistoryQ.data ?? { tabs: [], transactions: [] }, [customerHistoryQ.data]);
  const metrics: DebtMetrics | undefined = metricsQ.data;
  const refreshCustomerDebt = useCallback((id?: string) => {
    invalidateDebtCaches(queryClient, id);
  }, [queryClient]);

  return {
    // Data
    summary,
    customerDebt,
    customerHistory,
    metrics,

    // States
    loading: summaryQ.isLoading || customerDebtQ.isLoading || customerHistoryQ.isLoading,
    error: summaryQ.error || customerDebtQ.error || customerHistoryQ.error,

    // Mutations
    createCharge: charge.mutateAsync,
    createPayment: payment.mutateAsync,
    createAdjustment: adjustment.mutateAsync,
    markPaid: markPaid.mutateAsync,

    // Helpers
    refreshCustomerDebt,
    useTransactions: (filters: DebtHistoryFilters) => useStableDebtTransactions(filters),
  };
}

function useStableDebtTransactions(filters: DebtHistoryFilters) {
  const normalizedFilters = useMemo(() => ({
    ...filters,
  }), [filters]);

  return useDebtTransactionsQuery(normalizedFilters);
}
