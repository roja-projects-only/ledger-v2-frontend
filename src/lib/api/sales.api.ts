/**
 * Sales API
 * 
 * Handles sales CRUD operations, analytics, and reporting.
 */

import { apiClient } from "./client";
import type { Sale } from "@/lib/types";
import { 
  adaptSalesListResponse, 
  adaptItemResponse, 
  adaptMutationResponse,
  adaptSimpleListResponse 
} from "./adapters";
import type { ListResponse } from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface CreateSaleRequest {
  customerId: string;
  quantity: number;
  unitPrice: number;
  date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
}

export interface UpdateSaleRequest {
  customerId?: string;
  quantity?: number;
  unitPrice?: number;
  date?: string;
  notes?: string;
}

export interface SaleFilters {
  customerId?: string;
  userId?: string;
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DailySalesTrend {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
}

export interface LocationPerformance {
  location: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalQuantity: number;
  averageOrderValue: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// Sales API
// ============================================================================

export const salesApi = {
  /**
   * List sales with filters and pagination
   */
  list: async (filters?: SaleFilters): Promise<ListResponse<Sale>> => {
    const response = await apiClient.get("/sales", { params: filters });
    return adaptSalesListResponse<Sale>(response);
  },

  /**
   * Get sale by ID
   */
  get: async (id: string): Promise<Sale> => {
    const response = await apiClient.get(`/sales/${id}`);
    return adaptItemResponse<Sale>(response).data;
  },

  /**
   * Create new sale (total auto-calculated)
   */
  create: async (data: CreateSaleRequest): Promise<Sale> => {
    const response = await apiClient.post("/sales", data);
    return adaptItemResponse<Sale>(response).data;
  },

  /**
   * Update sale (total recalculated if qty/price changed)
   */
  update: async (id: string, data: UpdateSaleRequest): Promise<Sale> => {
    const response = await apiClient.patch(`/sales/${id}`, data);
    return adaptItemResponse<Sale>(response).data;
  },

  /**
   * Delete sale (admin or own within 24h)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/sales/${id}`);
    adaptMutationResponse<null>(response);
  },

  /**
   * Get today's sales
   */
  today: async (): Promise<Sale[]> => {
    const response = await apiClient.get("/sales/today");
    return adaptSalesListResponse<Sale>(response).data;
  },

  /**
   * Get sales by specific date
   */
  byDate: async (date: string): Promise<Sale[]> => {
    const response = await apiClient.get(`/sales/date/${date}`);
    return adaptSalesListResponse<Sale>(response).data;
  },

  /**
   * Get customer purchase history (grouped by date)
   */
  customerHistory: async (customerId: string): Promise<Sale[]> => {
    const response = await apiClient.get(`/sales/customer/${customerId}/history`);
    return adaptSalesListResponse<Sale>(response).data;
  },

  /**
   * Get daily sales trend (for charts)
   */
  dailyTrend: async (startDate: string, endDate: string): Promise<DailySalesTrend[]> => {
    const response = await apiClient.get("/sales/analytics/daily-trend", {
      params: { startDate, endDate },
    });
    return adaptSimpleListResponse<DailySalesTrend>(response).data;
  },

  /**
   * Get location performance (for charts)
   */
  locationPerformance: async (startDate: string, endDate: string): Promise<LocationPerformance[]> => {
    const response = await apiClient.get("/sales/analytics/location-performance", {
      params: { startDate, endDate },
    });
    return adaptSimpleListResponse<LocationPerformance>(response).data;
  },

  /**
   * Get sales summary statistics
   */
  summary: async (filters?: { startDate?: string; endDate?: string }): Promise<SalesSummary> => {
    const response = await apiClient.get("/sales/summary", { params: filters });
    return adaptItemResponse<SalesSummary>(response).data;
  },
};
