import { useCallback, useMemo } from "react";
import { DownloadCloud, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePWAStatus } from "@/lib/hooks/usePWAStatus";
import { notify } from "@/lib/notifications";
import { cn } from "@/lib/utils";

import type { ComponentProps } from "react";

interface PWAInstallButtonProps extends ComponentProps<typeof Button> {
  label?: string;
}

function getPlatformInstructions(): string {
  if (typeof window === "undefined") {
    return "Open your browser menu and choose Add to Home Screen.";
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isiOS =
    /iphone|ipad|ipod/.test(ua) ||
    (/macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);

  if (isiOS) {
    return "In Safari, tap Share → Add to Home Screen.";
  }

  if (/android/.test(ua)) {
    return "In the browser menu, tap Add to Home screen.";
  }

  return "Open your browser menu and choose Install or Add to Home Screen.";
}

export function PWAInstallButton({
  className,
  label = "Install app",
  children,
  ...buttonProps
}: PWAInstallButtonProps) {
  const { canInstall, supportsInstallPrompt, promptInstall, isInstalled, isStandalone } = usePWAStatus();

  const instructions = useMemo(getPlatformInstructions, []);

  const handleClick = useCallback(async () => {
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

    notify.info(instructions, {
      description: "If you don't see the option, make sure pop-ups are allowed for this site.",
      duration: 6000,
    });
  }, [canInstall, instructions, promptInstall, supportsInstallPrompt]);

  if (isInstalled || isStandalone) {
    return null;
  }

  const Icon = supportsInstallPrompt && canInstall ? DownloadCloud : Smartphone;

  return (
    <Button
      type="button"
      onClick={handleClick}
      className={cn("gap-2", className)}
      aria-label="Install Ledger"
      {...buttonProps}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {children ?? label}
    </Button>
  );
}
