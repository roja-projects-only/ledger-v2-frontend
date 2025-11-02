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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any; // Axios response after interceptor unwrapping

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
export function adaptSalesListResponse<T>(response: ApiResponse): ListResponse<T> {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: { data: [...], pagination: {...} } }
  return {
    data: response.data.data,
    pagination: response.data.pagination,
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
export function adaptCustomersListResponse<T>(response: ApiResponse): ListResponse<T> {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: [...], pagination: {...} }
  return {
    data: response.data,
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
export function adaptSimpleListResponse<T>(response: ApiResponse): ListResponse<T> {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: [...] }
  return {
    data: response.data,
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
export function adaptItemResponse<T>(response: ApiResponse): ItemResponse<T> {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: {...} }
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
export function adaptMutationResponse<T>(response: ApiResponse): MutationResponse<T> {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: {...}, message: "..." }
  return {
    data: response.data,
    message: response.message,
  };
}

/**
 * Adapter for Debts list endpoints (backend returns { items, total })
 *
 * Backend response (after Axios unwraps):
 * response = { success: true, data: { items: [...], total: number }, message? }
 */
export function adaptDebtsListResponse<T>(
  response: ApiResponse,
  opts?: { page?: number; limit?: number }
): ListResponse<T> {
  const items = Array.isArray(response.data?.items) ? response.data.items : [];
  const total = Number(response.data?.total ?? items.length);
  const page = Number(opts?.page ?? 1);
  const limit = Number(opts?.limit ?? (items.length || 50));
  const totalPages = Math.max(1, Math.ceil(total / (limit || 1)));
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
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

export function adaptAuthResponse(response: ApiResponse): AuthResponse {
  // Axios interceptor already unwrapped response.data
  // response = { success: true, data: { user, accessToken, refreshToken } }
  return {
    user: response.data.user,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  };
}
