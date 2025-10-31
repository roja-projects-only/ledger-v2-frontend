import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AgingReportCustomer,
  AgingReportData,
  DailyPaymentsReport,
  PaymentSummary,
} from "@/lib/types";

export const useDailyPaymentsReport = (date: string) =>
  useQuery<DailyPaymentsReport>({
    queryKey: queryKeys.payments.dailyReport(date),
    queryFn: () => paymentsApi.getDailyPaymentsReport(date),
    enabled: Boolean(date),
  });

export const useAgingReport = () =>
  useQuery<AgingReportData>({
    queryKey: queryKeys.payments.agingReport(),
    queryFn: paymentsApi.getAgingReport,
  });

export const usePaymentSummary = () =>
  useQuery<PaymentSummary>({
    queryKey: queryKeys.payments.summary(),
    queryFn: paymentsApi.getPaymentSummary,
  });

export const useHighRiskCustomers = (customers: AgingReportCustomer[] | undefined) =>
  useMemo(() => {
    if (!customers?.length) {
      return [] as AgingReportCustomer[];
    }

    return [...customers]
      .sort((a, b) => b.over90Days - a.over90Days || b.totalOwed - a.totalOwed)
      .slice(0, 5);
  }, [customers]);
