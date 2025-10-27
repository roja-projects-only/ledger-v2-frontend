/**
 * Navbar - Top navigation bar with page context
 */

import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight, DownloadCloud, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/hooks/useSettings";
import { usePWAStatus } from "@/lib/hooks/usePWAStatus";
import { notify } from "@/lib/notifications";

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
  const {
    canInstall,
    supportsInstallPrompt,
    promptInstall,
    isInstalled,
    isStandalone,
  } = usePWAStatus();

  const pageInfo = PAGE_INFO[location.pathname] || {
    title: "Water Ledger",
    description: "",
  };

  const businessName = settings.businessName?.trim();

  const platformInstructions = useMemo(() => {
    if (typeof window === "undefined") {
      return "Open your browser menu and choose Add to Home Screen.";
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua) ||
      (/macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);

    if (isiOS) {
      return "In Safari, tap Share → Add to Home Screen.";
    }

    if (/android/.test(ua)) {
      return "In the browser menu, tap Add to Home screen.";
    }

    return "Open your browser menu and choose Install or Add to Home Screen.";
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (supportsInstallPrompt && canInstall) {
      const outcome = await promptInstall();

      if (outcome === "accepted") {
        notify.success("Ledger is installing. You can now launch it from your home screen.");
      } else if (outcome === "dismissed") {
        notify.info("Install dismissed. You can try again anytime.");
      } else {
        notify.warning("Installation is not available in this browser.");
      }

      return;
    }

    notify.info(platformInstructions, {
      description: "If you don't see the option, make sure pop-ups are allowed for this site.",
      duration: 6000,
    });
  }, [canInstall, platformInstructions, promptInstall, supportsInstallPrompt]);

  const showInstallButton = !isInstalled && !isStandalone;

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

        {showInstallButton ? (
          <Button size="sm" className="gap-2" onClick={handleInstallClick} variant="outline">
            {supportsInstallPrompt && canInstall ? (
              <DownloadCloud className="h-4 w-4" aria-hidden />
            ) : (
              <Smartphone className="h-4 w-4" aria-hidden />
            )}
            Install app
          </Button>
        ) : null}
      </div>
    </header>
  );
}
