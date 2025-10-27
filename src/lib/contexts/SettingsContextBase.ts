import { createContext } from "react";
import type { SettingValue } from "@/lib/api/settings.api";
import type { Settings } from "@/lib/types";

export interface SettingsDictionary extends Settings {
  [key: string]: SettingValue | undefined;
}

export interface SettingsContextType {
  settings: SettingsDictionary;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<SettingsDictionary>) => Promise<boolean>;
  updateEnableCustomPricing: (enableCustomPricing: boolean) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);
