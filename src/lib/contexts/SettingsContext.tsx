/**
 * SettingsContext - Global settings state management
 * 
 * Provides settings data to all components without duplicate fetching.
 * Replaces per-component useSettings() calls with shared context.
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { settingsApi, handleApiError } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Settings } from "@/lib/types";
import type { SettingValue } from "@/lib/api/settings.api";

// ============================================================================
// Types
// ============================================================================

interface SettingsDictionary extends Settings {
  [key: string]: SettingValue | undefined;
}

interface SettingsContextType {
  settings: SettingsDictionary;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<SettingsDictionary>) => Promise<boolean>;
  updateEnableCustomPricing: (enableCustomPricing: boolean) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const SettingsContext = createContext<SettingsContextType | null>(null);

const buildSettingsState = (
  incoming?: Record<string, SettingValue>
): SettingsDictionary => ({
  ...DEFAULT_SETTINGS,
  ...(incoming ?? {}),
}) as SettingsDictionary;

// ============================================================================
// Provider Component
// ============================================================================

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsDictionary>(() =>
    buildSettingsState()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch settings on mount
   */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsObj = await settingsApi.getAsObject();
      setSettings(buildSettingsState(settingsObj));
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      console.error("Failed to fetch settings:", apiError);
      // Use default settings on error
      setSettings(buildSettingsState());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  /**
   * Update multiple settings
   */
  const updateSettings = useCallback(async (
    updates: Partial<SettingsDictionary>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Update each setting via API
      await Promise.all(
        Object.entries(updates).map(([key, value]) => {
          if (value === undefined) {
            return Promise.resolve();
          }

          // Detect the type before converting to string
          let type: "string" | "number" | "boolean" | "json";
          if (typeof value === "number") {
            type = "number";
          } else if (typeof value === "boolean") {
            type = "boolean";
          } else if (typeof value === "object" && value !== null) {
            type = "json";
          } else {
            type = "string";
          }

          const serializedValue =
            type === "json" ? JSON.stringify(value) : String(value);

          return settingsApi.upsert({
            key,
            value: serializedValue,
            type,
          });
        })
      );

      // Refresh settings after updates
      await fetchSettings();
      return true;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSettings]);

  /**
   * Update only the custom pricing toggle
   */
  const updateEnableCustomPricing = useCallback(async (
    enableCustomPricing: boolean
  ): Promise<boolean> => {
    try {
      setError(null);
      // Don't set loading state for this quick toggle operation

      // Update via API
      await settingsApi.upsert({
        key: 'enableCustomPricing',
        value: String(enableCustomPricing),
        type: 'boolean',
      });

      // Update local state immediately for responsive UI
      setSettings((prev) => ({
        ...prev,
        enableCustomPricing,
      }));

      return true;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      console.error("Failed to update custom pricing:", apiError);
      return false;
    }
  }, []);

  /**
   * Reset settings to default values
   */
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return await updateSettings({
      unitPrice: DEFAULT_SETTINGS.unitPrice,
      currency: DEFAULT_SETTINGS.currency,
      businessName: DEFAULT_SETTINGS.businessName,
      enableCreditFeature: DEFAULT_SETTINGS.enableCreditFeature,
      defaultCreditLimit: DEFAULT_SETTINGS.defaultCreditLimit,
      daysBeforeOverdue: DEFAULT_SETTINGS.daysBeforeOverdue,
    });
  }, [updateSettings]);

  /**
   * Refresh settings manually
   */
  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSettings,
    updateEnableCustomPricing,
    resetToDefaults,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
