import { useMemo } from 'react';
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
} from '@/lib/queries/debtsQueries';

export function useDebts(customerId?: string) {
  const summaryQ = useDebtSummaryQuery();
  const customerDebtQ = useCustomerDebtQuery(customerId || '', !!customerId);
  const customerHistoryQ = useCustomerDebtHistoryQuery(customerId || '', !!customerId);
  const metricsQ = useDebtMetricsQuery();

  const charge = useChargeMutation();
  const payment = usePaymentMutation();
  const adjustment = useAdjustmentMutation();
  const markPaid = useMarkPaidMutation();

  const summary: DebtSummaryItem[] = summaryQ.data ?? [];
  const customerDebt = useMemo(() => customerDebtQ.data ?? null, [customerDebtQ.data]);
  const customerHistory = useMemo(() => customerHistoryQ.data ?? { tabs: [], transactions: [] }, [customerHistoryQ.data]);
  const metrics: DebtMetrics | undefined = metricsQ.data;

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

    // Fetch helpers
    useTransactions: (filters: DebtHistoryFilters) => useDebtTransactionsQuery(filters),
  };
}
