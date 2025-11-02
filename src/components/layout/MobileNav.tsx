/**
 * MobileNav - Mobile slide-out navigation drawer
 * 
 * Performance optimizations:
 * - Fast animations (200ms open/close)
 * - Memoized nav links and handlers
 * - Simplified user profile (no dropdown)
 * - Auto-close on navigation
 */

import { memo, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  TrendingUp,
  Users,
  History,
  Settings,
  User,
  LogOut,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NavLink {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", path: "/", icon: BarChart3 },
  { label: "Today", path: "/today", icon: Home },
  { label: "Previous", path: "/previous", icon: Calendar },
  { label: "Analysis", path: "/analysis", icon: TrendingUp },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "History", path: "/history", icon: History },
  { label: "Settings", path: "/settings", icon: Settings, adminOnly: true },
];

// ============================================================================
// Component
// ============================================================================

export const MobileNav = memo(function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Filter navigation links based on user role (memoized)
  const visibleLinks = useMemo(
    () => NAV_LINKS.filter((link) => !link.adminOnly || user?.role === "ADMIN"),
    [user?.role]
  );

  // Close drawer immediately on navigation
  const handleLinkClick = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout();
    onOpenChange(false);
    navigate("/login", { replace: true });
  }, [logout, onOpenChange, navigate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 flex flex-col will-change-transform"
      >
        {/* Brand/Logo Section */}
        <div className="flex h-16 items-center border-b px-6 flex-shrink-0">
          <Link 
            to="/" 
            className="flex items-center gap-2 font-semibold text-lg"
            onClick={handleLinkClick}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              WL
            </div>
            <span>Water Ledger</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto" aria-label="Mobile navigation">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                aria-current={isActive ? "page" : undefined}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-base",
                    isActive && "bg-secondary font-medium"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {isActive && <ChevronRight className="ml-auto h-5 w-5" />}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section - Simplified */}
        <div className="border-t p-4 flex-shrink-0 space-y-2">
          {user ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start text-sm min-w-0 flex-1">
                  <span className="font-medium truncate w-full">{user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </div>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              <p>Not signed in</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});
