/**
 * Customers API
 * 
 * Handles customer CRUD operations and related endpoints.
 */

import { apiClient } from "./client";
import type { Customer, Location } from "@/lib/types";
import {
  adaptCustomersListResponse,
  adaptItemResponse,
  adaptMutationResponse,
  adaptSimpleListResponse,
  asEnvelope,
} from "./adapters";
import type {
  CustomersListApiEnvelope,
  ItemApiEnvelope,
  ListResponse,
  MutationApiEnvelope,
  SimpleListApiEnvelope,
} from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface CreateCustomerRequest {
  name: string;
  location: Location;
  phone?: string;
  customUnitPrice?: number;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  location?: Location;
  phone?: string;
  customUnitPrice?: number;
  creditLimit?: number;
  notes?: string;
}

export interface CustomerFilters {
  search?: string;
  location?: Location;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface CustomerStats {
  totalSales: number;
  totalRevenue: number;
  lastPurchaseDate: string | null;
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
// Customers API
// ============================================================================

export const customersApi = {
  /**
   * List customers with filters and pagination
   */
  list: async (filters?: CustomerFilters): Promise<ListResponse<Customer>> => {
    const response = await apiClient.get<CustomersListApiEnvelope<Customer>>(
      "/customers",
      { params: filters }
    );
    return adaptCustomersListResponse<Customer>(
      asEnvelope<CustomersListApiEnvelope<Customer>>(response)
    );
  },

  /**
   * Get customer by ID
   */
  get: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<ItemApiEnvelope<Customer>>(`/customers/${id}`);
    return adaptItemResponse<Customer>(asEnvelope<ItemApiEnvelope<Customer>>(response)).data;
  },

  /**
   * Create new customer
   */
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<ItemApiEnvelope<Customer>>("/customers", data);
    return adaptItemResponse<Customer>(asEnvelope<ItemApiEnvelope<Customer>>(response)).data;
  },

  /**
   * Update customer
   */
  update: async (id: string, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.put<ItemApiEnvelope<Customer>>(`/customers/${id}`, data);
    return adaptItemResponse<Customer>(asEnvelope<ItemApiEnvelope<Customer>>(response)).data;
  },

  /**
   * Delete customer (soft delete, admin only)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<MutationApiEnvelope<null>>(`/customers/${id}`);
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },

  /**
   * Restore deleted customer (admin only)
   */
  restore: async (id: string): Promise<Customer> => {
    const response = await apiClient.post<ItemApiEnvelope<Customer>>(`/customers/${id}/restore`);
    return adaptItemResponse<Customer>(asEnvelope<ItemApiEnvelope<Customer>>(response)).data;
  },

  /**
   * Get customer statistics
   */
  stats: async (id: string): Promise<CustomerStats> => {
    const response = await apiClient.get<ItemApiEnvelope<CustomerStats>>(
      `/customers/${id}/stats`
    );
    return adaptItemResponse<CustomerStats>(
      asEnvelope<ItemApiEnvelope<CustomerStats>>(response)
    ).data;
  },

  /**
   * Get distinct locations from existing customers
   */
  locations: async (): Promise<Location[]> => {
    const response = await apiClient.get<SimpleListApiEnvelope<Location>>(
      "/customers/locations"
    );
    return adaptSimpleListResponse<Location>(
      asEnvelope<SimpleListApiEnvelope<Location>>(response)
    ).data;
  },
};
