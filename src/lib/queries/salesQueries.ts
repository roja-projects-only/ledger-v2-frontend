/**
 * Sales Query Functions - React Query Integration
 * 
 * This file contains React Query hooks for sales data:
 * - useSalesQuery: Fetch all sales with automatic caching
 * - useAddSaleMutation: Add new sale with optimistic updates
 * - useUpdateSaleMutation: Update sale with optimistic updates
 * - useDeleteSaleMutation: Delete sale with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi, handleApiError } from '@/lib/api';
import type { ListResponse } from '@/lib/api/adapters';
import type { Sale } from '@/lib/types';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch all sales with pagination loop
 * Backend returns max 100 per page, so we loop until all data fetched
 */
async function fetchAllSales(): Promise<Sale[]> {
  let allSales: Sale[] = [];
  let currentPage = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response: ListResponse<Sale> = await salesApi.list({ 
      page: currentPage, 
      limit: 100 
    });
    
    allSales = [...allSales, ...response.data];
    hasMore = response.pagination?.hasNext ?? false;
    currentPage++;
  }
  
  return allSales;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook: Fetch all sales
 * Uses React Query for automatic caching and background refetch
 */
export function useSalesQuery() {
  return useQuery({
    queryKey: queryKeys.sales.lists(),
    queryFn: fetchAllSales,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook: Add sale mutation with optimistic updates
 * Handles both create and update (upsert behavior)
 */
export function useAddSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleData: {
      customerId: string;
      quantity: number;
      unitPrice: number;
      date: string;
      notes?: string;
    }) => {
      return await salesApi.create(saleData);
    },
    
    // Optimistic update - immediately update UI
    onMutate: async (newSale) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.sales.lists() });
      
      // Snapshot previous value for rollback
      const previousSales = queryClient.getQueryData<Sale[]>(queryKeys.sales.lists());
      
      // Optimistically update cache with temporary sale
      queryClient.setQueryData<Sale[]>(queryKeys.sales.lists(), (old = []) => [
        {
          id: `temp-${Date.now()}`,
          customerId: newSale.customerId,
          userId: '', // Will be set by backend
          quantity: newSale.quantity,
          unitPrice: newSale.unitPrice,
          total: newSale.quantity * newSale.unitPrice,
          date: newSale.date,
          notes: newSale.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customer: undefined, // Will be populated by backend
          user: undefined,
          // Payment tracking fields
          paymentType: 'CASH' as const, // Default to cash payment
        } as Sale,
        ...old,
      ]);
      
      return { previousSales };
    },
    
    // Rollback on error
    onError: (err, _newSale, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKeys.sales.lists(), context.previousSales);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to save sale: ${apiError.message}`);
    },
    
    // Show success message (check wasUpdated flag)
    onSuccess: (data) => {
      toast.success(data.wasUpdated ? 'Sale updated successfully' : 'Sale added successfully');
    },
    
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.lists() });
    },
  });
}

/**
 * Hook: Update sale mutation with optimistic updates
 */
export function useUpdateSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: {
        customerId?: string;
        quantity?: number;
        unitPrice?: number;
        date?: string;
        notes?: string;
      };
    }) => {
      return await salesApi.update(id, updates);
    },
    
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sales.lists() });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKeys.sales.lists());
      
      // Update the specific sale in cache
      queryClient.setQueryData<Sale[]>(queryKeys.sales.lists(), (old = []) =>
        old.map(sale => {
          if (sale.id === id) {
            // Calculate new total if quantity or unitPrice changed
            const newQuantity = updates.quantity ?? sale.quantity;
            const newUnitPrice = updates.unitPrice ?? sale.unitPrice;
            return {
              ...sale,
              ...updates,
              total: newQuantity * newUnitPrice,
              updatedAt: new Date().toISOString(),
            };
          }
          return sale;
        })
      );
      
      return { previousSales };
    },
    
    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKeys.sales.lists(), context.previousSales);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to update sale: ${apiError.message}`);
    },
    
    // Show success message
    onSuccess: () => {
      toast.success('Sale updated successfully');
    },
    
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.lists() });
    },
  });
}

/**
 * Hook: Delete sale mutation with optimistic updates
 */
export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await salesApi.delete(id);
    },
    
    // Optimistic update - remove from UI immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.sales.lists() });
      const previousSales = queryClient.getQueryData<Sale[]>(queryKeys.sales.lists());
      
      // Remove sale from cache
      queryClient.setQueryData<Sale[]>(queryKeys.sales.lists(), (old = []) =>
        old.filter(sale => sale.id !== id)
      );
      
      return { previousSales };
    },
    
    // Rollback on error
    onError: (err, _id, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKeys.sales.lists(), context.previousSales);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to delete sale: ${apiError.message}`);
    },
    
    // Show success message
    onSuccess: () => {
      toast.success('Sale deleted successfully');
    },
    
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.lists() });
    },
  });
}
