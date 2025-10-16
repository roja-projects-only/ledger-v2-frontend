/**
 * Header - App header with navigation and user menu
 * 
 * Features:
 * - Desktop: horizontal nav links
 * - Mobile: hamburger menu icon
 * - User dropdown (sign out)
 * - Active link highlighting
 */

import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Menu, User, LogOut } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface HeaderProps {
  onMenuClick?: () => void;
}

interface NavLink {
  label: string;
  path: string;
}

// ============================================================================
// Constants
// ============================================================================

const NAV_LINKS: NavLink[] = [
  { label: "Today", path: "/" },
  { label: "Previous", path: "/previous" },
  { label: "Analysis", path: "/analysis" },
  { label: "Customers", path: "/customers" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

// ============================================================================
// Component
// ============================================================================

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">Water Ledger</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    isActive && "bg-secondary"
                  )}
                >
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
