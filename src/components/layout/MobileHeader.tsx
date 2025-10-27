/**
 * MobileHeader - Mobile header with hamburger menu and page context
 * 
 * Features:
 * - Visible only on mobile (hidden on md+ screens)
 * - Hamburger menu button
 * - Page context (business name + page title + description)
 */

import { Menu, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PWAInstallButton } from "@/components/shared/PWAInstallButton";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/hooks/useSettings";

// ============================================================================
// Types
// ============================================================================

interface MobileHeaderProps {
  onMenuClick: () => void;
}

interface PageInfo {
  title: string;
  description?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PAGE_INFO: Record<string, PageInfo> = {
  "/": { title: "Today", description: "Quick entry" },
  "/previous": { title: "Previous", description: "Past entries" },
  "/analysis": { title: "Analysis", description: "Sales trends" },
  "/customers": { title: "Customers", description: "Manage records" },
  "/history": { title: "History", description: "Customer timeline" },
  "/settings": { title: "Settings", description: "Configure app" },
};

// ============================================================================
// Component
// ============================================================================

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const location = useLocation();
  const { settings } = useSettings();

  const pageInfo = PAGE_INFO[location.pathname] || {
    title: "Water Ledger",
    description: "",
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="h-11 w-11 -ml-2"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Page Context */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {settings.businessName?.trim() && (
            <>
              <span className="max-w-[100px] truncate font-medium text-foreground">
                {settings.businessName}
              </span>
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            </>
          )}
          <span className="truncate font-semibold text-foreground">
            {pageInfo.title}
          </span>
        </div>
        {pageInfo.description && (
          <p className="truncate text-xs text-muted-foreground">
            {pageInfo.description}
          </p>
        )}
      </div>

      <PWAInstallButton size="sm" variant="outline" className="shrink-0">
        Install
      </PWAInstallButton>
    </header>
  );
}
