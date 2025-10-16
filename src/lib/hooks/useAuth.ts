/**
 * useAuth - Custom hook for authentication
 * 
 * Backend API integration with JWT tokens.
 * Manages user session and authentication state.
 */

import { useCallback, useEffect, useState } from "react";
import { authService } from "@/lib/auth";
import type { User } from "@/lib/types";

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session && session.isAuthenticated) {
          setUser(session.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with username and passcode
   */
  const login = useCallback(
    async (username: string, passcode: string): Promise<boolean> => {
      setIsLoggingIn(true);
      setLoginError(null);

      try {
        const result = await authService.login(username, passcode);

        if (result.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
          setIsLoggingIn(false);
          return true;
        } else {
          const errorMessage = result.error || "Login failed";
          setLoginError(errorMessage);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoggingIn(false);
          return false;
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage = "An unexpected error occurred";
        setLoginError(errorMessage);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoggingIn(false);
        return false;
      }
    },
    []
  );

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setLoginError(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  /**
   * Legacy signIn method (for backward compatibility)
   * @deprecated Use login instead
   */
  const signIn = useCallback(
    async (username: string, passcode: string): Promise<boolean> => {
      return login(username, passcode);
    },
    [login]
  );

  /**
   * Legacy signOut method (for backward compatibility)
   * @deprecated Use logout instead
   */
  const signOut = useCallback(() => {
    logout();
  }, [logout]);

  return {
    // User data
    user,
    isAuthenticated,

    // Auth methods (new)
    login,
    logout,

    // Auth methods (legacy - for backward compatibility)
    signIn,
    signOut,

    // Loading states
    loading: isLoading || isLoggingIn,
    isLoggingIn,

    // Error states
    error: loginError,
    loginError,
  };
}
