/**
 * useCustomers - Custom hook for managing customers
 * 
 * React Query integration for customer CRUD operations with automatic caching.
 * Provides the same interface as before, but with optimized caching.
 */

import { useCallback, useState } from "react";
import { customersApi, handleApiError } from "@/lib/api";
import type { Customer, Location } from "@/lib/types";
import { 
  useCustomersQuery, 
  useAddCustomerMutation, 
  useUpdateCustomerMutation, 
  useDeleteCustomerMutation 
} from "@/lib/queries/customersQueries";
import { useSales } from "./useSales";

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

  // Get sales data for checking if customer has sales
  const { sales } = useSales();

  // Convert React Query error to string
  const error = queryError ? (queryError as Error).message : null;

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    customerId: string | null;
    customerName: string | null;
    salesCount: number;
  }>({
    open: false,
    customerId: null,
    customerName: null,
    salesCount: 0,
  });

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

  /**
   * Request delete customer (show confirmation dialog)
   */
  const requestDeleteCustomer = useCallback(
    (customerId: string, customerName: string) => {
      const salesCount = sales.filter((s) => s.customerId === customerId).length;
      
      setDeleteConfirmation({
        open: true,
        customerId,
        customerName,
        salesCount,
      });
    },
    [sales]
  );

  /**
   * Confirm delete customer (actually delete)
   */
  const confirmDeleteCustomer = useCallback(async () => {
    if (!deleteConfirmation.customerId) return;
    
    // Block if customer has sales
    if (deleteConfirmation.salesCount > 0) {
      setDeleteConfirmation({ open: false, customerId: null, customerName: null, salesCount: 0 });
      return;
    }
    
    await deleteCustomer(deleteConfirmation.customerId);
    setDeleteConfirmation({ open: false, customerId: null, customerName: null, salesCount: 0 });
  }, [deleteConfirmation, deleteCustomer]);

  /**
   * Cancel delete customer (close dialog)
   */
  const cancelDeleteCustomer = useCallback(() => {
    setDeleteConfirmation({ open: false, customerId: null, customerName: null, salesCount: 0 });
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
    
    // Confirmation Methods
    requestDeleteCustomer,
    confirmDeleteCustomer,
    cancelDeleteCustomer,
    deleteConfirmation,
    
    // States
    loading,
    error,
  };
}
