/**
 * Auth API
 * 
 * Handles authentication endpoints: login, logout, refresh, register, etc.
 */

import { apiClient, tokenManager } from "./client";
import { adaptAuthResponse, adaptItemResponse } from "./adapters";

// ============================================================================
// Types
// ============================================================================

export interface LoginRequest {
  username: string;
  passcode: string; // Backend expects 6-digit passcode
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    role: "ADMIN" | "STAFF";
    active: boolean;
  };
}

export interface RegisterRequest {
  username: string;
  passcode: string; // Backend expects 6-digit passcode
  role?: "ADMIN" | "STAFF";
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  /**
   * Login with username and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", data);
    const authData = adaptAuthResponse(response);
    
    // Store tokens
    tokenManager.setTokens(authData.accessToken, authData.refreshToken);
    
    return {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: authData.user,
    };
  },

  /**
   * Logout (invalidate tokens)
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      // Always clear tokens, even if API call fails
      tokenManager.clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/refresh", data);
    const authData = adaptAuthResponse(response);
    
    // Update tokens
    tokenManager.setTokens(authData.accessToken, authData.refreshToken);
    
    return {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: authData.user,
    };
  },

  /**
   * Register new user (admin only, max 3 users)
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/register", data);
    const authData = adaptAuthResponse(response);
    
    return {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: authData.user,
    };
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.post("/auth/change-password", data);
  },

  /**
   * Get current user info
   */
  me: async (): Promise<LoginResponse["user"]> => {
    const response = await apiClient.get("/auth/me");
    return adaptItemResponse<LoginResponse["user"]>(response).data;
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated: (): boolean => {
    return !!tokenManager.getAccessToken();
  },
};
