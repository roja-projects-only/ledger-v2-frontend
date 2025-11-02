/**
 * Navbar - Top navigation bar with page context
 */

import { useLocation } from "react-router-dom";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { ChevronRight } from "lucide-react";

interface PageInfo {
  title: string;
  description?: string;
}

const PAGE_INFO: Record<string, PageInfo> = {
  "/": {
    title: "Today",
    description: "Quick entry and today's sales",
  },
  "/previous": {
    title: "Previous Entries",
    description: "View and manage past entries",
  },
  "/analysis": {
    title: "Date Range Analysis",
    description: "Sales trends and insights",
  },
  "/customers": {
    title: "Customers",
    description: "Manage customer records",
  },
  "/history": {
    title: "Customer History",
    description: "Individual customer timeline",
  },
  "/settings": {
    title: "Settings",
    description: "Configure application",
  },
};

export function Navbar() {
  const location = useLocation();
  const { settings } = useSettings();

  const pageInfo = PAGE_INFO[location.pathname] || {
    title: "Water Ledger",
    description: "",
  };

  const businessName = settings.businessName?.trim();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {businessName && (
              <>
                <span className="font-medium text-foreground">{businessName}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="font-semibold text-foreground">{pageInfo.title}</span>
          </div>
          {pageInfo.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {pageInfo.description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
