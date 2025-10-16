/**
 * Authentication Service
 * 
 * Backend API integration for authentication using JWT tokens.
 * Replaces localStorage-based authentication with secure backend calls.
 */

import type { AuthState, AuthResult, User } from "@/lib/types";
import { authApi, handleApiError } from "@/lib/api";

// ============================================================================
// Session Storage (in memory + localStorage for user data only)
// ============================================================================

const SESSION_KEY = "ledger:currentUser";

function saveUserToSession(user: User): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save user to session:", error);
  }
}

function getUserFromSession(): User | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch (error) {
    console.error("Failed to read user from session:", error);
    return null;
  }
}

function clearUserFromSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear user from session:", error);
  }
}

// ============================================================================
// Authentication Service
// ============================================================================

export const authService = {
  /**
   * Login with username and passcode
   * 
   * Backend: POST /api/auth/login
   * - Validates credentials
   * - Returns JWT access token + refresh token
   * - Tokens stored in localStorage via tokenManager
   */
  async login(username: string, passcode: string): Promise<AuthResult> {
    try {
      // Call backend API
      const response = await authApi.login({
        username,
        passcode, // Backend expects 6-digit passcode
      });

      // Convert backend user to app User type
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        passcode: "", // Not needed anymore
        active: response.user.active,
        createdAt: new Date().toISOString(), // Backend doesn't return this yet
      };

      // Save user to session storage
      saveUserToSession(user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      
      // CRITICAL: Clear any stale session data on failed login
      clearUserFromSession();
      
      return {
        success: false,
        error: apiError.message,
      };
    }
  },

  /**
   * Logout current user
   * 
   * Backend: POST /api/auth/logout
   * - Invalidates refresh token on backend
   * - Clears tokens from localStorage
   */
  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      clearUserFromSession();
    }
  },

  /**
   * Get current auth session
   * 
   * Checks if user is authenticated by:
   * 1. Checking if tokens exist (via authApi.isAuthenticated)
   * 2. Retrieving user from session storage
   * 
   * Future: Validate token with backend on app load
   */
  async getSession(): Promise<AuthState | null> {
    try {
      // Check if tokens exist
      if (!authApi.isAuthenticated()) {
        return null;
      }

      // Get user from session
      const user = getUserFromSession();
      if (!user) {
        return null;
      }

      return {
        isAuthenticated: true,
        user,
      };
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session?.isAuthenticated ?? false;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  },

  /**
   * Refresh user data from backend
   * 
   * Backend: GET /api/auth/me
   * - Fetches current user info using access token
   * - Updates session storage
   */
  async refreshUser(): Promise<User | null> {
    try {
      const userData = await authApi.me();
      
      const user: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        passcode: "",
        active: userData.active,
        createdAt: new Date().toISOString(),
      };

      saveUserToSession(user);
      return user;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  },
};
