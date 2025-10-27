/**
 * useDebtData - Hook for managing debt data with error handling and retry
 * 
 * Provides centralized debt data management with built-in error handling,
 * retry functionality, and loading states for the customer debt integration.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { isAxiosError } from "axios";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";

import type { OutstandingBalance } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface UseDebtDataOptions {
  customerId: string | null;
  enabled?: boolean;
}

interface UseDebtDataReturn {
  outstandingBalance: OutstandingBalance | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retry: () => void;
  refetch: () => void;
  hasDebt: boolean;
  isDebtServiceAvailable: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useDebtData({
  customerId,
  enabled = true,
}: UseDebtDataOptions): UseDebtDataReturn {
  const queryClient = useQueryClient();

  const {
    data: outstandingBalance,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<OutstandingBalance | null, Error>({
    queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    queryFn: async () => {
      if (!customerId) return null;
      
      try {
        const data = await paymentsApi.getCustomerOutstanding(customerId);
        return data;
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          const status = err.response?.status;

          if (status === 404) {
            // Customer not found or no debt records - this is not an error
            return null;
          }

          if (status === 503 || err.code === "ERR_NETWORK") {
            throw new Error("Debt service is temporarily unavailable");
          }

          if (status === 401 || status === 403) {
            // Surface auth errors directly
            throw err;
          }

          throw err;
        }

        // Handle specific error cases
        throw err instanceof Error
          ? err
          : new Error("Failed to retrieve outstanding balance");
      }
    },
    enabled: enabled && !!customerId,
    retry: (failureCount, retryError) => {
      // Don't retry on 404 (customer not found)
      if (isAxiosError(retryError)) {
        const status = retryError.response?.status;

        if (status === 404) {
          return false;
        }

        if (status === 401 || status === 403) {
          return false;
        }
      }

      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    // Optimize background refetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false, // Don't auto-refetch unless explicitly needed
  });

  const retry = useCallback(() => {
    // Clear any cached error state
    queryClient.removeQueries({
      queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    });
    
    // Refetch the data
    refetch();
  }, [queryClient, customerId, refetch]);

  const hasDebt = useMemo(() => 
    outstandingBalance ? outstandingBalance.totalOwed > 0 : false,
    [outstandingBalance]
  );
  
  // Determine if debt service is available based on error type
  const isDebtServiceAvailable = useMemo(() => 
    !isError || (error && !error.message.includes('temporarily unavailable')),
    [isError, error]
  );

  return useMemo(
    () => ({
      outstandingBalance: outstandingBalance || null,
      isLoading,
      isError,
      error: error ?? null,
      isRetrying: isRefetching,
      retry,
      refetch,
      hasDebt,
      isDebtServiceAvailable,
    }),
    [
    outstandingBalance,
    isLoading,
    isError,
    error,
    isRefetching,
    retry,
    refetch,
    hasDebt,
    isDebtServiceAvailable,
    ]
  );
}