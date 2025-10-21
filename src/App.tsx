/**
 * App - Main application component with routing
 */

import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ProtectedRoute, AdminRoute } from "@/components/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Today } from "@/pages/Today";
import { PreviousEntries } from "@/pages/PreviousEntries";
import { DateRangeAnalysis } from "@/pages/DateRangeAnalysis";
import { CustomerHistory } from "@/pages/CustomerHistory";
import { Settings } from "@/pages/Settings";
import { Customers } from "@/pages/Customers";
import { OutstandingBalances } from "@/pages/OutstandingBalances";
import { NotFound } from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { SettingsProvider } from "@/lib/contexts/SettingsContext";
import { queryClient } from "@/lib/queryClient";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";

/**
 * LoginRedirect - Redirect authenticated users away from login page
 */
function LoginRedirect() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

/**
 * AppLayout - Main layout wrapper for authenticated routes
 * Includes swipe gesture support for mobile sidebar
 */
function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Swipe gesture handler - only open sidebar (not close)
  const handleSwipeRight = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  // Enable swipe gesture only on mobile when sidebar is closed
  // Larger hitbox (120px) but requires faster/longer swipe to avoid conflicts
  useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    edgeThreshold: 120, // Swipe from left 120px area (larger hitbox)
    swipeThreshold: 100, // Must swipe at least 100px (longer swipe)
    enabled: !mobileNavOpen, // Disable when sidebar is open
  });

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      <div className="flex flex-col flex-1 md:ml-64 min-w-0">
        {/* Swipe indicator - subtle edge glow on mobile (120px hitbox) */}
        <div 
          className="md:hidden fixed left-0 top-0 bottom-0 w-[2px] bg-gradient-to-r from-primary/30 to-transparent pointer-events-none z-40"
          aria-hidden="true"
        />

        <div className="md:hidden">
          <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

        <div className="hidden md:block">
          <Navbar />
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto min-w-0">
          <Routes>
            {/* Dashboard Page - Home/Analytics */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Today Page - Primary data entry */}
            <Route path="/today" element={<Today />} />
            
            {/* Settings Page - Admin Only */}
            <Route 
              path="/settings" 
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              } 
            />
            
            {/* Customers Page */}
            <Route path="/customers" element={<Customers />} />
            
            {/* Previous Entries Page */}
            <Route path="/previous" element={<PreviousEntries />} />
            
            {/* Date Range Analysis Page */}
            <Route path="/analysis" element={<DateRangeAnalysis />} />
            
            {/* Customer History Page */}
            <Route path="/history" element={<CustomerHistory />} />
            
            {/* Outstanding Balances Page */}
            <Route path="/outstanding" element={<OutstandingBalances />} />
            
            {/* 404 Page - Catch-all for unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <Routes>
            {/* Public Route - Login Page */}
            <Route path="/login" element={<LoginRedirect />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Toast notifications - Global */}
          <Toaster />
        </SettingsProvider>
      </BrowserRouter>
      
      {/* React Query DevTools - Only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
