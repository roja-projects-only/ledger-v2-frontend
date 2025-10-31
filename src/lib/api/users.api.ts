/**
 * Users API
 * 
 * Handles user management endpoints (admin only).
 */

import { apiClient } from "./client";
import {
  adaptSimpleListResponse,
  adaptItemResponse,
  adaptMutationResponse,
  asEnvelope,
} from "./adapters";
import type {
  ItemApiEnvelope,
  MutationApiEnvelope,
  SimpleListApiEnvelope,
} from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  role: "ADMIN" | "STAFF";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  passcode: string; // 6-digit passcode
  role?: "ADMIN" | "STAFF";
}

export interface UpdateUserRequest {
  username?: string;
  role?: "ADMIN" | "STAFF";
  active?: boolean;
}

export interface ChangeUserPasswordRequest {
  newPassword: string; // 6-digit passcode
}

export interface UserStats {
  total: number;
  active: number;
  byRole: {
    ADMIN: number;
    STAFF: number;
  };
}

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
  /**
   * List all users (admin only)
   */
  list: async (): Promise<User[]> => {
    const response = await apiClient.get<SimpleListApiEnvelope<User>>("/users");
    return adaptSimpleListResponse<User>(
      asEnvelope<SimpleListApiEnvelope<User>>(response)
    ).data;
  },

  /**
   * Get user by ID (admin only)
   */
  get: async (id: string): Promise<User> => {
    const response = await apiClient.get<ItemApiEnvelope<User>>(`/users/${id}`);
    return adaptItemResponse<User>(asEnvelope<ItemApiEnvelope<User>>(response)).data;
  },

  /**
   * Create new user (admin only, max 3 users)
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post<ItemApiEnvelope<User>>("/users", data);
    return adaptItemResponse<User>(asEnvelope<ItemApiEnvelope<User>>(response)).data;
  },

  /**
   * Update user (admin only)
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch<ItemApiEnvelope<User>>(`/users/${id}`, data);
    return adaptItemResponse<User>(asEnvelope<ItemApiEnvelope<User>>(response)).data;
  },

  /**
   * Delete user (admin only, cannot delete self)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete<MutationApiEnvelope<null>>(`/users/${id}`);
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },

  /**
   * Change user password (admin only)
   */
  changePassword: async (id: string, data: ChangeUserPasswordRequest): Promise<void> => {
    const response = await apiClient.post<MutationApiEnvelope<null>>(
      `/users/${id}/change-password`,
      data
    );
    adaptMutationResponse<null>(asEnvelope<MutationApiEnvelope<null>>(response));
  },

  /**
   * Get user statistics (admin only)
   */
  stats: async (): Promise<UserStats> => {
    const response = await apiClient.get<ItemApiEnvelope<UserStats>>("/users/stats");
    return adaptItemResponse<UserStats>(
      asEnvelope<ItemApiEnvelope<UserStats>>(response)
    ).data;
  },
};
