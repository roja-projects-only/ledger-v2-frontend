/**
 * useCustomers - Custom hook for managing customers
 * 
 * React Query integration for customer CRUD operations with automatic caching.
 * Provides the same interface as before, but with optimized caching.
 */

import { useCallback } from "react";
import { customersApi, handleApiError } from "@/lib/api";
import type { Customer, Location } from "@/lib/types";
import { 
  useCustomersQuery, 
  useAddCustomerMutation, 
  useUpdateCustomerMutation, 
  useDeleteCustomerMutation 
} from "@/lib/queries/customersQueries";

// ============================================================================
// Hook
// ============================================================================

export function useCustomers() {
  // Fetch customers with React Query (automatic caching)
  const { data: customers = [], isLoading: loading, error: queryError } = useCustomersQuery();
  
  // Mutations with optimistic updates
  const addCustomerMutation = useAddCustomerMutation();
  const updateCustomerMutation = useUpdateCustomerMutation();
  const deleteCustomerMutation = useDeleteCustomerMutation();

  // Convert React Query error to string
  const error = queryError ? (queryError as Error).message : null;

  /**
   * Get customer by ID
   */
  const getCustomer = useCallback(async (id: string): Promise<Customer | null> => {
    try {
      return await customersApi.get(id);
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to get customer:", apiError);
      return null;
    }
  }, []);

  /**
   * Create new customer
   */
  const addCustomer = useCallback(
    async (data: {
      name: string;
      location: Location;
      phone?: string;
      customUnitPrice?: number;
      notes?: string;
    }): Promise<Customer | null> => {
      try {
        const newCustomer = await addCustomerMutation.mutateAsync(data);
        return newCustomer;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to add customer:", err);
        return null;
      }
    },
    [addCustomerMutation]
  );

  /**
   * Update customer
   */
  const updateCustomer = useCallback(
    async (
      id: string,
      data: {
        name?: string;
        location?: Location;
        phone?: string;
        customUnitPrice?: number;
        notes?: string;
      }
    ): Promise<Customer | null> => {
      try {
        const updatedCustomer = await updateCustomerMutation.mutateAsync({ id, updates: data });
        return updatedCustomer;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to update customer:", err);
        return null;
      }
    },
    [updateCustomerMutation]
  );

  /**
   * Delete customer (soft delete, admin only)
   */
  const deleteCustomer = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteCustomerMutation.mutateAsync(id);
        return true;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to delete customer:", err);
        return false;
      }
    },
    [deleteCustomerMutation]
  );

  /**
   * Get customers by location
   */
  const getCustomersByLocation = useCallback(
    (location: Location): Customer[] => {
      return customers.filter((c) => c.location === location);
    },
    [customers]
  );

  /**
   * Search customers by name
   */
  const searchCustomers = useCallback(
    (searchTerm: string): Customer[] => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return customers;
      
      return customers.filter((c) =>
        c.name.toLowerCase().includes(term)
      );
    },
    [customers]
  );

  /**
   * Get customer stats
   */
  const getCustomerStats = useCallback(async (id: string) => {
    try {
      return await customersApi.stats(id);
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to get customer stats:", apiError);
      return null;
    }
  }, []);

  return {
    // Data
    customers,
    
    // Methods
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    getCustomersByLocation,
    searchCustomers,
    getCustomerStats,
    
    // States
    loading,
    error,
  };
}
