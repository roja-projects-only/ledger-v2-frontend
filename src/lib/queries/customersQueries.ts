/**
 * Customers Query Functions - React Query Integration
 * 
 * This file contains React Query hooks for customers data:
 * - useCustomersQuery: Fetch all customers with automatic caching
 * - useAddCustomerMutation: Add new customer with optimistic updates
 * - useUpdateCustomerMutation: Update customer with optimistic updates
 * - useDeleteCustomerMutation: Delete (deactivate) customer with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, handleApiError } from '@/lib/api';
import type { ListResponse } from '@/lib/api/adapters';
import type { Customer, Location } from '@/lib/types';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch all customers with pagination loop
 * Backend returns max 100 per page, so we loop until all data fetched
 */
async function fetchAllCustomers(): Promise<Customer[]> {
  let allCustomers: Customer[] = [];
  let currentPage = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response: ListResponse<Customer> = await customersApi.list({ 
      active: true,
      page: currentPage, 
      limit: 100 
    });
    
    allCustomers = [...allCustomers, ...response.data];
    hasMore = response.pagination?.hasNext ?? false;
    currentPage++;
  }
  
  return allCustomers;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook: Fetch all customers
 * Uses React Query for automatic caching and background refetch
 */
export function useCustomersQuery() {
  return useQuery({
    queryKey: queryKeys.customers.lists(),
    queryFn: fetchAllCustomers,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook: Add customer mutation with optimistic updates
 */
export function useAddCustomerMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerData: {
      name: string;
      location: Location;
      phone?: string;
      customUnitPrice?: number;
      notes?: string;
    }) => {
      return await customersApi.create(customerData);
    },
    
    // Optimistic update - immediately update UI
    onMutate: async (newCustomer) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      
      // Snapshot previous value for rollback
      const previousCustomers = queryClient.getQueryData<Customer[]>(queryKeys.customers.lists());
      
      // Optimistically update cache with temporary customer
      queryClient.setQueryData<Customer[]>(queryKeys.customers.lists(), (old = []) => [
        {
          id: `temp-${Date.now()}`,
          name: newCustomer.name,
          location: newCustomer.location,
          phone: newCustomer.phone,
          customUnitPrice: newCustomer.customUnitPrice,
          notes: newCustomer.notes,
          active: true,
          createdById: '', // Will be set by backend
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: undefined,
          // Payment tracking fields
          creditLimit: 1000, // Default credit limit
          outstandingBalance: 0, // New customers start with no debt
          lastPaymentDate: undefined,
          collectionStatus: 'ACTIVE' as const,
        } as Customer,
        ...old,
      ]);
      
      return { previousCustomers };
    },
    
    // Rollback on error
    onError: (err, _newCustomer, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(queryKeys.customers.lists(), context.previousCustomers);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to add customer: ${apiError.message}`);
    },
    
    // Show success message
    onSuccess: () => {
      toast.success('Customer added successfully');
    },
    
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/**
 * Hook: Update customer mutation with optimistic updates
 */
export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: {
        name?: string;
        location?: Location;
        phone?: string;
        customUnitPrice?: number;
        notes?: string;
      };
    }) => {
      return await customersApi.update(id, updates);
    },
    
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      const previousCustomers = queryClient.getQueryData<Customer[]>(queryKeys.customers.lists());
      
      // Update the specific customer in cache
      queryClient.setQueryData<Customer[]>(queryKeys.customers.lists(), (old = []) =>
        old.map(customer => {
          if (customer.id === id) {
            return {
              ...customer,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return customer;
        })
      );
      
      return { previousCustomers };
    },
    
    // Rollback on error
    onError: (err, _variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(queryKeys.customers.lists(), context.previousCustomers);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to update customer: ${apiError.message}`);
    },
    
    // Show success message
    onSuccess: () => {
      toast.success('Customer updated successfully');
    },
    
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/**
 * Hook: Delete (deactivate) customer mutation with optimistic updates
 */
export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await customersApi.delete(id);
    },
    
    // Optimistic update - remove from UI immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      const previousCustomers = queryClient.getQueryData<Customer[]>(queryKeys.customers.lists());
      
      // Remove customer from cache
      queryClient.setQueryData<Customer[]>(queryKeys.customers.lists(), (old = []) =>
        old.filter(customer => customer.id !== id)
      );
      
      return { previousCustomers };
    },
    
    // Rollback on error
    onError: (err, _id, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(queryKeys.customers.lists(), context.previousCustomers);
      }
      const apiError = handleApiError(err);
      toast.error(`Failed to delete customer: ${apiError.message}`);
    },
    
    // Show success message
    onSuccess: () => {
      toast.success('Customer deleted successfully');
    },
    
    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}
