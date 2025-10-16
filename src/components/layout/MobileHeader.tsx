/**
 * MobileHeader - Mobile header with hamburger menu and page context
 * 
 * Features:
 * - Visible only on mobile (hidden on md+ screens)
 * - Hamburger menu button
 * - Page context (business name + page title + description)
 */

import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { Menu, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

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
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:hidden">
      {/* Hamburger Menu Button */}
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-9 w-9">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Page Context */}
      <div className="flex-1 min-w-0 px-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {settings.businessName?.trim() && (
            <>
              <span className="font-medium text-foreground truncate max-w-[100px]">
                {settings.businessName}
              </span>
              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            </>
          )}
          <span className="font-semibold text-foreground truncate">
            {pageInfo.title}
          </span>
        </div>
        {pageInfo.description && (
          <p className="text-xs text-muted-foreground truncate">
            {pageInfo.description}
          </p>
        )}
      </div>
    </header>
  );
}
