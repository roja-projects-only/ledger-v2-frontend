/**
 * useDebtData - Hook for managing debt data with error handling and retry
 * 
 * Provides centralized debt data management with built-in error handling,
 * retry functionality, and loading states for the customer debt integration.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  } = useQuery({
    queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    queryFn: async () => {
      if (!customerId) return null;
      
      try {
        const data = await paymentsApi.getCustomerOutstanding(customerId);
        return data;
      } catch (error: any) {
        // Handle specific error cases
        if (error?.response?.status === 404) {
          // Customer not found or no debt records - this is not an error
          return null;
        }
        
        if (error?.response?.status === 503 || error?.code === 'NETWORK_ERROR') {
          // Service unavailable - debt service might be down
          throw new Error('Debt service is temporarily unavailable');
        }
        
        // Re-throw other errors
        throw error;
      }
    },
    enabled: enabled && !!customerId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (customer not found)
      if (error?.response?.status === 404) {
        return false;
      }
      
      // Don't retry on 401/403 (auth errors)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    select: (data: any) => {
      // Ensure we have a valid OutstandingBalance object or null
      if (!data) return null;
      
      // If the API returns the expected structure, use it
      if (typeof data === "object" && "customerId" in data) {
        return data as OutstandingBalance;
      }
      
      // Fallback to null if data structure is unexpected
      return null;
    },
  });

  const retry = () => {
    // Clear any cached error state
    queryClient.removeQueries({
      queryKey: queryKeys.payments.customerOutstanding(customerId || ""),
    });
    
    // Refetch the data
    refetch();
  };

  const hasDebt = outstandingBalance ? outstandingBalance.totalOwed > 0 : false;
  
  // Determine if debt service is available based on error type
  const isDebtServiceAvailable = !isError || 
    (error && !error.message.includes('temporarily unavailable'));

  return {
    outstandingBalance: outstandingBalance || null,
    isLoading,
    isError,
    error: error as Error | null,
    isRetrying: isRefetching,
    retry,
    refetch,
    hasDebt,
    isDebtServiceAvailable,
  };
}