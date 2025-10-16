/**
 * useSales - Custom hook for managing sales data
 * 
 * React Query integration for sales CRUD operations with automatic caching.
 * Provides the same interface as before, but with optimized caching.
 */

import { useCallback, useMemo, useState } from "react";
import { salesApi, handleApiError } from "@/lib/api";
import type { Sale } from "@/lib/types";
import { getTodayISO } from "@/lib/utils";
import { 
  useSalesQuery, 
  useAddSaleMutation, 
  useUpdateSaleMutation, 
  useDeleteSaleMutation 
} from "@/lib/queries/salesQueries";

// ============================================================================
// Hook
// ============================================================================

export function useSales() {
  // Fetch sales with React Query (automatic caching)
  const { data: sales = [], isLoading: loading, error: queryError } = useSalesQuery();
  
  // Mutations with optimistic updates
  const addSaleMutation = useAddSaleMutation();
  const updateSaleMutation = useUpdateSaleMutation();
  const deleteSaleMutation = useDeleteSaleMutation();

  // Convert React Query error to string
  const error = queryError ? (queryError as Error).message : null;

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    saleId: string | null;
    saleDetails: { customer: string; amount: string; date: string } | null;
  }>({
    open: false,
    saleId: null,
    saleDetails: null,
  });

  /**
   * Get all sales sorted by date (most recent first)
   */
  const allSales = useMemo(() => {
    return [...sales].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sales]);

  /**
   * Add a new sale (with upsert behavior)
   * If sale exists for customer on same date, updates it instead
   */
  const addSale = useCallback(
    async (saleData: {
      customerId: string;
      quantity: number;
      unitPrice: number;
      date: string;
      notes?: string;
    }): Promise<Sale | null> => {
      try {
        const result = await addSaleMutation.mutateAsync(saleData);
        return result;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to save sale:", err);
        return null;
      }
    },
    [addSaleMutation]
  );

  /**
   * Update an existing sale
   */
  const updateSale = useCallback(
    async (
      id: string,
      updates: {
        customerId?: string;
        quantity?: number;
        unitPrice?: number;
        date?: string;
        notes?: string;
      }
    ): Promise<Sale | null> => {
      try {
        const updatedSale = await updateSaleMutation.mutateAsync({ id, updates });
        return updatedSale;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to update sale:", err);
        return null;
      }
    },
    [updateSaleMutation]
  );

  /**
   * Delete a sale
   */
  const deleteSale = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteSaleMutation.mutateAsync(id);
        return true;
      } catch (err) {
        // Error handling done in mutation
        console.error("Failed to delete sale:", err);
        return false;
      }
    },
    [deleteSaleMutation]
  );

  /**
   * Get today's sales (computed from cached data)
   */
  const getTodaySales = useCallback((): Sale[] => {
    const today = getTodayISO();
    // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
    return sales.filter((s) => s.date.split('T')[0] === today);
  }, [sales]);

  /**
   * Get sales by specific date (computed from cached data)
   */
  const getSalesByDate = useCallback(
    (date: string): Sale[] => {
      // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
      return sales.filter((s) => s.date.split('T')[0] === date);
    },
    [sales]
  );

  /**
   * Get sales by customer (computed from cached data)
   */
  const getSalesByCustomer = useCallback(
    (customerId: string): Sale[] => {
      return sales.filter((s) => s.customerId === customerId);
    },
    [sales]
  );

  /**
   * Get sales by date range (computed from cached data)
   */
  const getSalesByDateRange = useCallback(
    (startDate: string, endDate: string): Sale[] => {
      // Backend returns full ISO format (2025-10-16T00:00:00.000Z), extract date part
      return sales.filter((s) => {
        const saleDate = s.date.split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
      });
    },
    [sales]
  );

  /**
   * Fetch today's sales from API (more efficient than loading all)
   */
  const fetchTodaySales = useCallback(async (): Promise<Sale[]> => {
    try {
      return await salesApi.today();
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to fetch today's sales:", apiError);
      return [];
    }
  }, []);

  /**
   * Fetch sales by date from API
   */
  const fetchSalesByDate = useCallback(async (date: string): Promise<Sale[]> => {
    try {
      return await salesApi.byDate(date);
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to fetch sales by date:", apiError);
      return [];
    }
  }, []);

  /**
   * Fetch customer history from API
   */
  const fetchCustomerHistory = useCallback(async (customerId: string): Promise<Sale[]> => {
    try {
      return await salesApi.customerHistory(customerId);
    } catch (err) {
      const apiError = handleApiError(err);
      console.error("Failed to fetch customer history:", apiError);
      return [];
    }
  }, []);

  /**
   * Request delete sale (show confirmation dialog)
   */
  const requestDeleteSale = useCallback(
    (saleId: string, customer: string, amount: string, date: string) => {
      setDeleteConfirmation({
        open: true,
        saleId,
        saleDetails: { customer, amount, date },
      });
    },
    []
  );

  /**
   * Confirm delete sale (actually delete)
   */
  const confirmDeleteSale = useCallback(async () => {
    if (!deleteConfirmation.saleId) return;
    
    await deleteSale(deleteConfirmation.saleId);
    setDeleteConfirmation({ open: false, saleId: null, saleDetails: null });
  }, [deleteConfirmation.saleId, deleteSale]);

  /**
   * Cancel delete sale (close dialog)
   */
  const cancelDeleteSale = useCallback(() => {
    setDeleteConfirmation({ open: false, saleId: null, saleDetails: null });
  }, []);

  return {
    // Data
    sales,
    allSales,
    
    // Methods
    addSale,
    updateSale,
    deleteSale,
    getTodaySales,
    getSalesByDate,
    getSalesByCustomer,
    getSalesByDateRange,
    
    // API Methods (more efficient for specific queries)
    fetchTodaySales,
    fetchSalesByDate,
    fetchCustomerHistory,
    
    // Confirmation Methods
    requestDeleteSale,
    confirmDeleteSale,
    cancelDeleteSale,
    deleteConfirmation,
    
    // States
    loading,
    error,
  };
}
