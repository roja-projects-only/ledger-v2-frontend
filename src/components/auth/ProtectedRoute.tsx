/**
 * ProtectedRoute - Route wrapper for authenticated pages
 * 
 * Features:
 * - Redirects to login if not authenticated
 * - Shows loading state while checking authentication
 * - Stores intended destination for post-login redirect
 * - Renders children only when authenticated
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <TodayPage />
 * </ProtectedRoute>
 * ```
 */

import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Store the intended destination for post-login redirect
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Store current path in sessionStorage for redirect after login
      sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search);
    }
  }, [isAuthenticated, loading, location]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
