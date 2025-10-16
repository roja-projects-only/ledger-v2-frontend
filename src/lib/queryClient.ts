/**
 * React Query Client Configuration
 * 
 * Centralized configuration for React Query caching behavior.
 * - staleTime: How long data is considered fresh (no refetch)
 * - gcTime: How long unused data stays in cache
 * - retry: Number of retry attempts on failure
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 30 seconds (no refetch)
      staleTime: 30 * 1000,
      
      // Cache data for 5 minutes (stays in memory)
      gcTime: 5 * 60 * 1000, // formerly cacheTime in older versions
      
      // Retry failed requests 1 time
      retry: 1,
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Disable refetch on reconnect (not critical for our use case)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
