/**
 * AdminRoute - Route protection component for admin-only pages
 * 
 * Restricts access to specific routes based on user role.
 * Staff users are redirected to the home page with an error toast.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Show toast only once when staff user tries to access admin page
    if (isAuthenticated && user?.role === "STAFF" && !hasShownToast.current) {
      toast.error("Access denied. This page is only available to administrators.");
      hasShownToast.current = true;
    }
  }, [isAuthenticated, user]);

  // If not authenticated, ProtectedRoute will handle the redirect
  if (!isAuthenticated) {
    return null;
  }

  // If user is staff, redirect to home
  if (user?.role === "STAFF") {
    return <Navigate to="/" replace />;
  }

  // If user is admin, render the protected component
  return <>{children}</>;
}
