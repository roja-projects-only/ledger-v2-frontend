import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DISMISS_STORAGE_KEY = "ledger:pwa-install-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

interface UsePWAStatusResult {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  isPromptDismissed: boolean;
  canInstall: boolean;
  supportsInstallPrompt: boolean;
  promptInstall: () => Promise<InstallOutcome>;
  dismissInstallPrompt: (options?: { ttlMs?: number }) => void;
  resetDismissedState: () => void;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface DismissState {
  timestamp: number;
  ttlMs: number;
}

type NullableDismissState = DismissState | null;

const getNow = () => Date.now();

const readDismissState = (): NullableDismissState => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DismissState | null;
    if (!parsed || typeof parsed.timestamp !== "number" || typeof parsed.ttlMs !== "number") {
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeDismissState = (state: DismissState) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};

const clearDismissedTimestamp = () => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DISMISS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

const isStandaloneDisplayMode = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;

  return Boolean(mediaQuery?.matches) || navigatorStandalone === true;
};

/**
 * Track install prompt availability and status for PWA UX.
 */
export function usePWAStatus(): UsePWAStatusResult {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplayMode());
  const [dismissState, setDismissState] = useState<NullableDismissState>(() => {
    const stored = readDismissState();
    if (!stored) return null;

    const elapsed = getNow() - stored.timestamp;
    const ttl = stored.ttlMs > 0 ? stored.ttlMs : DISMISS_TTL_MS;

    if (elapsed >= ttl) {
      clearDismissedTimestamp();
      return null;
    }

    return stored;
  });

  const dismissalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supportsInstallPrompt = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "onbeforeinstallprompt" in window;
  }, []);

  const isPromptDismissed = dismissState !== null;

  const scheduleDismissReset = useCallback(
    (state: NullableDismissState) => {
      if (dismissalTimer.current) {
        clearTimeout(dismissalTimer.current);
        dismissalTimer.current = null;
      }

      if (!state) return;

      const elapsed = getNow() - state.timestamp;
      const ttl = state.ttlMs > 0 ? state.ttlMs : DISMISS_TTL_MS;
      const remaining = ttl - elapsed;

      if (remaining <= 0) {
        setDismissState(null);
        clearDismissedTimestamp();
        return;
      }

      dismissalTimer.current = setTimeout(() => {
        setDismissState(null);
        clearDismissedTimestamp();
      }, remaining);
    },
    [],
  );

  useEffect(() => {
    scheduleDismissReset(dismissState);

    return () => {
      if (dismissalTimer.current) {
        clearTimeout(dismissalTimer.current);
        dismissalTimer.current = null;
      }
    };
  }, [dismissState, scheduleDismissReset]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPromptEvent(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setInstallPromptEvent(null);
      setDismissState(null);
      clearDismissedTimestamp();
    };

    const updateStandalone = () => {
      const standalone = isStandaloneDisplayMode();
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("visibilitychange", updateStandalone);

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    mediaQuery?.addEventListener("change", updateStandalone);

    // Initialize states on mount
    updateStandalone();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("visibilitychange", updateStandalone);
      mediaQuery?.removeEventListener("change", updateStandalone);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!installPromptEvent) {
      return "unavailable";
    }

    try {
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstallable(false);
        setInstallPromptEvent(null);
        setDismissState(null);
        clearDismissedTimestamp();
        return "accepted";
      }

      const state: DismissState = {
        timestamp: getNow(),
        ttlMs: DISMISS_TTL_MS,
      };

      setDismissState(state);
      writeDismissState(state);
      setInstallPromptEvent(null);
      setIsInstallable(false);
      return "dismissed";
    } catch (error) {
      console.error("PWA install prompt failed", error);
      return "unavailable";
    }
  }, [installPromptEvent]);

  const dismissInstallPrompt = useCallback(
    (options?: { ttlMs?: number }) => {
      const ttl = options?.ttlMs ?? DISMISS_TTL_MS;
      const state: DismissState = {
        timestamp: getNow(),
        ttlMs: ttl,
      };
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setDismissState(state);

      if (ttl !== DISMISS_TTL_MS) {
        if (dismissalTimer.current) {
          clearTimeout(dismissalTimer.current);
          dismissalTimer.current = null;
        }

        dismissalTimer.current = setTimeout(() => {
          setDismissState(null);
          clearDismissedTimestamp();
        }, ttl);
      }

      writeDismissState(state);
    },
    [],
  );

  const resetDismissedState = useCallback(() => {
    setDismissState(null);
    clearDismissedTimestamp();
  }, []);

  const canInstall = useMemo(() => {
    if (isInstalled || isStandalone) return false;
    return isInstallable && !isPromptDismissed;
  }, [isInstallable, isInstalled, isPromptDismissed, isStandalone]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    installPromptEvent,
    isPromptDismissed,
    canInstall,
    supportsInstallPrompt,
    promptInstall,
    dismissInstallPrompt,
    resetDismissedState,
  };
}
