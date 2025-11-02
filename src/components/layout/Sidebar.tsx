/**
 * Sidebar - Left sidebar navigation
 * 
 * Features:
 * - Persistent sidebar on desktop
 * - Collapsible/expandable
 * - Active link highlighting
 * - User profile section
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KeyboardShortcutsDialog } from "@/components/shared/KeyboardShortcutsDialog";
import { useAuth } from "@/lib/hooks/useAuth";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
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
  Keyboard,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

// ============================================================================
// Types
// ============================================================================

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
  // Entry point to Debt Management (switches to contextual nav)
  { label: "Debt Management", path: "/debts", icon: History },
];

// Contextual Debt Management links
const DEBT_LINKS: NavLink[] = [
  { label: "Overview", path: "/debts", icon: BarChart3 },
  { label: "Customer Debts", path: "/debts/customers", icon: Users },
  { label: "Payment History", path: "/debts/payments", icon: History },
  { label: "Analytics", path: "/debts/analytics", icon: TrendingUp },
  { label: "Back to Main", path: "/", icon: ChevronLeft },
];

// ============================================================================
// Component
// ============================================================================

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Detect debt management section by route prefix
  const isDebtRoute = location.pathname.startsWith("/debts");

  // Filter navigation links based on user role
  const visibleLinks = (isDebtRoute ? DEBT_LINKS : NAV_LINKS).filter(
    (link) => !link.adminOnly || user?.role === "ADMIN"
  );

  // Keyboard shortcut to show help
  useKeyboardShortcut({
    key: '?',
    shift: true,
    handler: () => setShowShortcuts(true),
    description: 'Show shortcuts',
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 border-r bg-card z-40">
      {/* Brand/Logo */}
      <div className="flex h-16 items-center border-b px-6 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            WL
          </div>
          <span>Water Ledger</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 overflow-y-auto" aria-label="Main navigation">
        <div className="space-y-1">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive ? "page" : undefined}
                className="block"
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
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t p-4 flex-shrink-0 space-y-2">
        {/* Keyboard Shortcuts Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShortcuts(true)}
          className="w-full justify-start"
        >
          <Keyboard className="mr-2 h-4 w-4" />
          Keyboard Shortcuts
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-accent h-14"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <p>Not signed in</p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
      />
    </aside>
  );
}
