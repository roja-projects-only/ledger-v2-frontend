import { useCallback, useEffect, useMemo } from "react";
import { RefreshCw, SmartphoneNfc, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface PWAUpdatePromptProps {
  className?: string;
}

const UPDATE_TOAST_ID = "pwa-update-available";

export function PWAUpdatePrompt({ className }: PWAUpdatePromptProps) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  const colors = useMemo(() => getSemanticColor("info"), []);

  useEffect(() => {
    if (!offlineReady) return;

    notify.success("Ledger is ready for offline use.", {
      id: "pwa-offline-ready",
      duration: 5000,
    });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;

    notify.info("A new version of Ledger is ready to install.", {
      id: UPDATE_TOAST_ID,
      duration: 6000,
    });
  }, [needRefresh]);

  const handleUpdate = useCallback(async () => {
    notify.info("Updating Ledger…", {
      id: UPDATE_TOAST_ID,
      duration: 4000,
    });

    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error("Failed to update service worker", error);
      notify.error("Update failed. Please refresh the page manually.", {
        duration: 6000,
      });
    }
  }, [updateServiceWorker]);

  const handleDismiss = useCallback(() => {
    setNeedRefresh(false);
    notify.info("You can update later from the in-app prompt.", {
      duration: 4000,
    });
  }, [setNeedRefresh]);

  if (!needRefresh) {
    return null;
  }

  return (
    <Alert
      className={cn(
        "w-full max-w-2xl border-2",
        colors.bg,
        colors.border,
        className,
      )}
      aria-live="polite"
    >
      <SmartphoneNfc className={cn("h-5 w-5", colors.icon)} aria-hidden />
      <div className="col-start-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <AlertTitle className="text-sm font-semibold text-foreground">
            New version available
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Restart Ledger now to load the latest improvements and fixes.
          </AlertDescription>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          <Button onClick={handleUpdate} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Update now
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="gap-1">
            <X className="h-4 w-4" aria-hidden />
            Later
          </Button>
        </div>
      </div>
    </Alert>
  );
}
