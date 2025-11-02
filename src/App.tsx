/**
 * App - Main application component with routing
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ProtectedRoute, AdminRoute } from "@/components/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { SettingsProvider } from "@/lib/contexts/SettingsContext";
import { queryClient } from "@/lib/queryClient";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";

// Lazy load page components for code-splitting (named exports)
const Login = lazy(() => import("@/pages/Login").then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Today = lazy(() => import("@/pages/Today").then(m => ({ default: m.Today })));
const PreviousEntries = lazy(() => import("@/pages/PreviousEntries").then(m => ({ default: m.PreviousEntries })));
const DateRangeAnalysis = lazy(() => import("@/pages/DateRangeAnalysis").then(m => ({ default: m.DateRangeAnalysis })));
const CustomerHistory = lazy(() => import("@/pages/CustomerHistory").then(m => ({ default: m.CustomerHistory })));
const Settings = lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })));
const Customers = lazy(() => import("@/pages/Customers").then(m => ({ default: m.Customers })));
const NotFound = lazy(() => import("@/pages/NotFound").then(m => ({ default: m.NotFound })));
const DebtsOverview = lazy(() => import("@/pages/DebtsOverview").then(m => ({ default: m.DebtsOverview })));
const DebtsCustomers = lazy(() => import("@/pages/DebtsCustomers").then(m => ({ default: m.DebtsCustomers })));
const DebtsPayments = lazy(() => import("@/pages/DebtsPayments").then(m => ({ default: m.DebtsPayments })));
const DebtsAnalytics = lazy(() => import("@/pages/DebtsAnalytics").then(m => ({ default: m.DebtsAnalytics })));

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
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }>
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

              {/* Debt Management - Contextual section */}
              <Route path="/debts" element={<DebtsOverview />} />
              <Route path="/debts/customers" element={<DebtsCustomers />} />
              <Route path="/debts/payments" element={<DebtsPayments />} />
              <Route path="/debts/analytics" element={<DebtsAnalytics />} />
              
              {/* 404 Page - Catch-all for unknown routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }>
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
          </Suspense>

          {/* Toast notifications - Global */}
          <Toaster />
        </SettingsProvider>
      </BrowserRouter>      {/* React Query DevTools - Only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
