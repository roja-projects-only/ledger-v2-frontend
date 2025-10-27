import { useEffect, useMemo, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";

const ONLINE_HIDE_DELAY_MS = 4000;

const getIsNavigatorOnline = () => {
  if (typeof window === "undefined") {
    return true;
  }

  return typeof window.navigator.onLine === "boolean" ? window.navigator.onLine : true;
};

type NetworkStatus = "online" | "offline";

interface OfflineIndicatorProps {
  className?: string;
  /**
   * Optional override for offline messaging within the inline pill.
   */
  offlineLabel?: string;
  /**
   * Optional override for the label that appears briefly once connection is restored.
   */
  onlineLabel?: string;
}

export function OfflineIndicator({
  className,
  offlineLabel = "Offline mode: changes will sync when you're back online",
  onlineLabel = "Connection restored",
}: OfflineIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>(getIsNavigatorOnline() ? "online" : "offline");
  const [isVisible, setIsVisible] = useState(() => status === "offline");

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSeenOfflineRef = useRef(status === "offline");
  const offlineStartRef = useRef<number | null>(status === "offline" ? Date.now() : null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync initial state if the component mounted before listeners were attached.
    setStatus(getIsNavigatorOnline() ? "online" : "offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (status === "offline") {
      hasSeenOfflineRef.current = true;
      offlineStartRef.current = Date.now();
      setIsVisible(true);

      notify.warning("You're offline", {
        description: "We'll keep things queued locally and sync once the connection returns.",
        duration: 5000,
      });
      return;
    }

    if (!hasSeenOfflineRef.current) {
      setIsVisible(false);
      return;
    }

    const offlineDurationMs = offlineStartRef.current ? Date.now() - offlineStartRef.current : null;
    offlineStartRef.current = null;
    setIsVisible(true);

    const description = offlineDurationMs
      ? `Reconnected after ${Math.round(offlineDurationMs / 1000)}s. Syncing in the background.`
      : "Your data is syncing in the background.";

    notify.success("Back online", {
      description,
      duration: 4000,
    });

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, ONLINE_HIDE_DELAY_MS);
  }, [status]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const tone = status === "online" ? "success" : "warning";
  const colors = useMemo(() => getSemanticColor(tone), [tone]);
  const Icon = status === "online" ? Wifi : WifiOff;
  const label = status === "online" ? onlineLabel : offlineLabel;

  if (!isVisible) {
    return (
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {status === "online" ? "Online" : "Offline"}
      </span>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      role="status"
      className={cn(
        "pointer-events-none fixed left-1/2 bottom-6 z-[70] flex w-full -translate-x-1/2 justify-center px-4",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-lg transition-colors",
          colors.bg,
          colors.border,
          colors.text,
        )}
      >
        <Icon className={cn("h-4 w-4", colors.icon)} aria-hidden="true" />
        <span className="truncate" title={label}>
          {label}
        </span>
      </div>
    </div>
  );
}
