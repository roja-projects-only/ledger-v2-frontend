import { useContext } from "react";
import { SettingsContext } from "@/lib/contexts/SettingsContextBase";

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
