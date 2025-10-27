import { onlineManager, type QueryClient } from "@tanstack/react-query";

let isRegistered = false;

export function registerOfflineSync(client: QueryClient) {
  if (isRegistered || typeof window === "undefined") {
    return;
  }

  isRegistered = true;

  onlineManager.setEventListener((setOnline) => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  onlineManager.subscribe((isOnline) => {
    if (!isOnline) {
      return;
    }

    void client.resumePausedMutations().catch(() => undefined);

    client.invalidateQueries({
      predicate: (query) => query.isActive(),
      refetchType: "active",
    });
  });

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    onlineManager.setOnline(false);
  }
}
