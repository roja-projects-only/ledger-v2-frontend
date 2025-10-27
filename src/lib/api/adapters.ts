/**
 * Response Adapters
 * 
 * CRITICAL: Axios interceptor in client.ts automatically unwraps response.data
 * - Backend sends: { success: true, data: {...} }
 * - Axios interceptor returns: { success: true, data: {...} }
 * - Adapters receive this directly (NOT wrapped in response.data)
 * 
 * The backend has inconsistent response structures across endpoints:
 * - Sales API: Double nested { success, data: { data: [...], pagination: {...} } }
 * - Customers API: Single nested { success, data: [...], pagination: {...} }
 * - Settings/Users APIs: Simple { success, data: [...] }
 * - Auth API: Single object { success, data: {...} }
 * 
 * These adapters normalize responses into a consistent internal format.
 */

/**
 * Internal response format for list endpoints
 */
export interface ListResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

/**
 * Internal response format for single item endpoints
 */
export interface ItemResponse<T> {
  data: T;
}

/**
 * Internal response format for mutation endpoints
 */
export interface MutationResponse<T> {
  data: T | null;
  message?: string;
}

export interface ApiListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface SalesListApiEnvelope<T> {
  success: boolean;
  data: {
    data: T[];
    pagination?: ApiListPagination;
  };
  message?: string;
}

export interface CustomersListApiEnvelope<T> {
  success: boolean;
  data: T[];
  pagination?: ApiListPagination;
  message?: string;
}

export interface SimpleListApiEnvelope<T> {
  success: boolean;
  data: T[];
  message?: string;
}

export interface ItemApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface MutationApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

export interface AuthApiEnvelope {
  success: boolean;
  data: AuthResponse;
  message?: string;
}

export const asEnvelope = <T>(response: unknown): T => {
  return response as T;
};

/**
 * Adapter for Sales API (double nested structure)
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: {
 *     data: [...],
 *     pagination: {...}
 *   }
 * }
 */
export function adaptSalesListResponse<T>(response: SalesListApiEnvelope<T>): ListResponse<T> {
  return {
    data: response.data?.data ?? [],
    pagination: response.data?.pagination,
  };
}

/**
 * Adapter for Customers API (single nested with root pagination)
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: [...],
 *   pagination: {...}
 * }
 */
export function adaptCustomersListResponse<T>(response: CustomersListApiEnvelope<T>): ListResponse<T> {
  return {
    data: response.data ?? [],
    pagination: response.pagination,
  };
}

/**
 * Adapter for Settings/Users APIs (simple array, no pagination)
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: [...]
 * }
 */
export function adaptSimpleListResponse<T>(response: SimpleListApiEnvelope<T>): ListResponse<T> {
  return {
    data: response.data ?? [],
    pagination: undefined,
  };
}

/**
 * Adapter for single item GET responses
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: {...}
 * }
 */
export function adaptItemResponse<T>(response: ItemApiEnvelope<T>): ItemResponse<T> {
  return {
    data: response.data,
  };
}

/**
 * Adapter for mutation responses (create, update, delete)
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: {...} or null,
 *   message: "..."
 * }
 */
export function adaptMutationResponse<T>(response: MutationApiEnvelope<T>): MutationResponse<T> {
  return {
    data: response.data,
    message: response.message,
  };
}

/**
 * Adapter for auth login/refresh responses
 * 
 * Backend response (after Axios unwraps):
 * response.data = {
 *   success: true,
 *   data: {
 *     user: {...},
 *     accessToken: "...",
 *     refreshToken: "..."
 *   }
 * }
 */
export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: 'ADMIN' | 'STAFF';
    active: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export function adaptAuthResponse(response: AuthApiEnvelope): AuthResponse {
  return {
    user: response.data.user,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  };
}
