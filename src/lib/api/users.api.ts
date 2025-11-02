/**
 * Users API
 * 
 * Handles user management endpoints (admin only).
 */

import { apiClient } from "./client";
import { 
  adaptSimpleListResponse, 
  adaptItemResponse, 
  adaptMutationResponse 
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
    const response = await apiClient.get("/users");
    return adaptSimpleListResponse<User>(response).data;
  },

  /**
   * Get user by ID (admin only)
   */
  get: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return adaptItemResponse<User>(response).data;
  },

  /**
   * Create new user (admin only, max 3 users)
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await apiClient.post("/users", data);
    return adaptItemResponse<User>(response).data;
  },

  /**
   * Update user (admin only)
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return adaptItemResponse<User>(response).data;
  },

  /**
   * Delete user (admin only, cannot delete self)
   */
  delete: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/users/${id}`);
    adaptMutationResponse<null>(response);
  },

  /**
   * Change user password (admin only)
   */
  changePassword: async (id: string, data: ChangeUserPasswordRequest): Promise<void> => {
    const response = await apiClient.post(`/users/${id}/change-password`, data);
    adaptMutationResponse<null>(response);
  },

  /**
   * Get user statistics (admin only)
   */
  stats: async (): Promise<UserStats> => {
    const response = await apiClient.get("/users/stats");
    return adaptItemResponse<UserStats>(response).data;
  },
};
