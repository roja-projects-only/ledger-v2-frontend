/**
 * API Client
 * 
 * Axios instance with interceptors for authentication and error handling.
 * Handles JWT token management and automatic token refresh.
 */

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ============================================================================
// Axios Instance
// ============================================================================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// ============================================================================
// Token Management
// ============================================================================

const TOKEN_KEY = "ledger:accessToken";
const REFRESH_TOKEN_KEY = "ledger:refreshToken";

export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ============================================================================
// Request Interceptor (Add Authorization Header)
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor (Handle Token Refresh)
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Extract data from successful responses
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token available
        isRefreshing = false; // CRITICAL: Reset flag so subsequent requests don't get stuck
        tokenManager.clearTokens();
        
        // Don't redirect if we're already on login page or if this is a login request
        const isLoginPage = window.location.pathname === "/login";
        const isLoginRequest = originalRequest.url?.includes("/auth/login");
        
        if (!isLoginPage && !isLoginRequest) {
          window.location.href = "/login";
        }
        
        return Promise.reject(error);
      }

      try {
        // Refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        tokenManager.setTokens(accessToken, newRefreshToken);
        isRefreshing = false;
        processQueue(null, accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        isRefreshing = false;
        processQueue(refreshError as Error, null);
        tokenManager.clearTokens();
        
        // Don't redirect if we're already on login page
        const isLoginPage = window.location.pathname === "/login";
        if (!isLoginPage) {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// ============================================================================
// Error Helper
// ============================================================================

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: {
        code?: string;
        message?: string;
      };
      errors?: Record<string, string[]>;
    }>;

    // Backend sends errors in this format: { success: false, error: { code, message } }
    const errorMessage = 
      axiosError.response?.data?.error?.message || 
      axiosError.response?.data?.message || 
      error.message || 
      "An error occurred";

    return {
      message: errorMessage,
      statusCode: axiosError.response?.status,
      errors: axiosError.response?.data?.errors,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "An unknown error occurred",
  };
};
