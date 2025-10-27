import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";
import { usePWAStatus, type InstallOutcome } from "@/lib/hooks/usePWAStatus";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  DownloadCloud,
  Info,
  Loader2,
  Smartphone,
  X,
} from "lucide-react";

type DevicePlatform = "ios" | "android" | "desktop";

type PromptViewState = "installable" | "manual" | "installed" | null;

interface PWAInstallPromptProps {
  className?: string;
  remindLaterTtlMs?: number;
  onOutcome?: (outcome: InstallOutcome) => void;
  onDismiss?: () => void;
}

function detectPlatform(): DevicePlatform {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) ||
    (/macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);

  if (isIOS) return "ios";
  if (/android/.test(ua)) return "android";

  return "desktop";
}

function getManualSteps(platform: DevicePlatform): string[] {
  if (platform === "ios") {
    return [
      "Open the Share menu in Safari.",
      "Select \"Add to Home Screen\" and confirm.",
    ];
  }

  if (platform === "android") {
    return [
      "Open the browser menu (⋮).",
      "Choose \"Add to Home screen\" and follow the prompt.",
    ];
  }

  return [
    "Open the browser menu.",
    "Look for an Install or Add to Home Screen option.",
  ];
}

export function PWAInstallPrompt({
  className,
  remindLaterTtlMs,
  onOutcome,
  onDismiss,
}: PWAInstallPromptProps) {
  const {
    canInstall,
    supportsInstallPrompt,
    promptInstall,
    dismissInstallPrompt,
    isInstalled,
    isStandalone,
    isPromptDismissed,
  } = usePWAStatus();

  const [isInstalling, setIsInstalling] = useState(false);
  const platform = useMemo(detectPlatform, []);

  const showInstallAction = supportsInstallPrompt && canInstall;
  const showManualInstructions = !supportsInstallPrompt && !isStandalone && !isInstalled && !isPromptDismissed;
  const shouldShowInstalledNotice = (isInstalled || isStandalone) && !showInstallAction && !showManualInstructions && !isPromptDismissed;

  const viewState: PromptViewState = showInstallAction
    ? "installable"
    : showManualInstructions
      ? "manual"
      : shouldShowInstalledNotice
        ? "installed"
        : null;

  const manualSteps = useMemo(() => getManualSteps(platform), [platform]);

  const semantic = useMemo(() => {
    if (viewState === "installed") return getSemanticColor("success");
    if (viewState === "manual") return getSemanticColor("warning");
    if (viewState === "installable") return getSemanticColor("info");
    return getSemanticColor("info");
  }, [viewState]);

  const statusBadge = useMemo(() => {
    if (viewState === "installed") return { label: "Installed", tone: "success" as const };
    if (viewState === "manual") return { label: "Manual steps", tone: "warning" as const };
    if (viewState === "installable") return { label: "Ready to install", tone: "info" as const };
    return null;
  }, [viewState]);

  if (viewState === null) {
    return null;
  }

  const handleInstall = async () => {
    if (!showInstallAction) return;

    setIsInstalling(true);
    const outcome = await promptInstall();
    setIsInstalling(false);

    onOutcome?.(outcome);

    if (outcome === "accepted") {
      notify.success("Ledger is installing. You can now launch it from your home screen.");
    } else if (outcome === "dismissed") {
      notify.info("Install dismissed. We'll remind you again later.");
    } else {
      notify.warning("Installation is not available on this browser.");
    }
  };

  const handleDismiss = () => {
    const ttlMs = remindLaterTtlMs ?? undefined;
    dismissInstallPrompt(ttlMs ? { ttlMs } : undefined);
    onDismiss?.();
  };

  const ActionIcon = viewState === "installed" ? CheckCircle2 : showInstallAction ? DownloadCloud : Smartphone;

  return (
    <Alert
      className={cn(
        "w-full max-w-2xl border-2",
        semantic.bg,
        semantic.border,
        className,
      )}
      aria-live="polite"
    >
      <ActionIcon className={cn("h-5 w-5", semantic.icon)} aria-hidden />
      <div className="col-start-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTitle className="text-sm font-semibold">
              Install Ledger for quick access
            </AlertTitle>
            {statusBadge ? (
              <Badge
                className={cn(
                  semantic.bg,
                  semantic.border,
                  semantic.text,
                  "border",
                )}
                variant="outline"
              >
                {statusBadge.label}
              </Badge>
            ) : null}
          </div>
          <AlertDescription className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Add Ledger to your home screen so you can capture deliveries even when the network is slow.
            </p>
            {viewState === "manual" ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">Follow these steps:</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                  {manualSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" aria-hidden />
                  <span>We&apos;ll keep this banner handy if you need the steps again.</span>
                </div>
              </div>
            ) : null}
            {viewState === "installed" ? (
              <p className="text-sm text-muted-foreground">
                Ledger is already installed on this device. Open it from your home screen for a fullscreen experience.
              </p>
            ) : null}
          </AlertDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          {showInstallAction ? (
            <Button onClick={handleInstall} disabled={isInstalling} className="gap-2">
              {isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <DownloadCloud className="h-4 w-4" aria-hidden />
              )}
              {isInstalling ? "Installing" : "Install app"}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="gap-1">
            <X className="h-4 w-4" aria-hidden />
            {viewState === "installed" ? "Dismiss" : "Not now"}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
