import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsApi, type DebtFilters, type CreateDebtRequest, type RecordPaymentRequest, type PaymentHistoryFilters, handleApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ListResponse, ItemResponse, MutationResponse } from '@/lib/api/adapters';
import type { DebtSummary, CustomerDebtSummary, CustomerDebtDetail, PaymentHistoryItem } from '@/lib/api';
import { toast } from 'sonner';

// Summary
export function useDebtSummary() {
  return useQuery<ItemResponse<DebtSummary>>({
    queryKey: queryKeys.debts.summary(),
    queryFn: () => debtsApi.getSummary(),
    staleTime: 30_000,
  });
}

// Customer debts list
export function useCustomerDebts(filters: DebtFilters) {
  return useQuery<ListResponse<CustomerDebtSummary>>({
    queryKey: queryKeys.debts.customersList(filters as unknown as Record<string, unknown>),
    queryFn: () => debtsApi.listCustomerDebts(filters),
    staleTime: 30_000,
  });
}

// Customer debt detail
export function useCustomerDebtDetail(customerId: string) {
  return useQuery<ItemResponse<CustomerDebtDetail | null>>({
    queryKey: queryKeys.debts.customerDetail(customerId),
    queryFn: () => debtsApi.getCustomerDebtDetail(customerId),
    staleTime: 30_000,
    enabled: Boolean(customerId),
  });
}

// Create debt
export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation<MutationResponse<unknown>, unknown, { customerId: string; body: CreateDebtRequest }>({
    mutationFn: ({ customerId, body }) => debtsApi.createDebt(customerId, body),
    onSuccess: () => {
      toast.success('Debt created');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customers() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
    },
    onError: (err) => {
      const e = handleApiError(err);
      toast.error(`Failed to create debt: ${e.message}`);
    },
  });
}

// Record payment
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation<MutationResponse<unknown>, unknown, { customerId: string; body: RecordPaymentRequest }>({
    mutationFn: ({ customerId, body }) => debtsApi.recordPayment(customerId, body),
    onSuccess: (_data, vars) => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: queryKeys.debts.customerDetail(vars.customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.debts.customers() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.summary() });
      qc.invalidateQueries({ queryKey: queryKeys.debts.payments() });
    },
    onError: (err) => {
      const e = handleApiError(err);
      toast.error(`Failed to record payment: ${e.message}`);
    },
  });
}

// Payment history
export function usePaymentHistory(filters: PaymentHistoryFilters) {
  return useQuery<ListResponse<PaymentHistoryItem>>({
    queryKey: queryKeys.debts.paymentsList(filters as unknown as Record<string, unknown>),
    queryFn: () => debtsApi.listPaymentHistory(filters),
    staleTime: 30_000,
  });
}
