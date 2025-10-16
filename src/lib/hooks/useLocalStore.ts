/**
 * useLocalStore - Custom hook for localStorage operations with TypeScript support
 * 
 * Features:
 * - Automatic JSON serialization/deserialization
 * - Error handling for quota exceeded and parse errors
 * - Cross-tab synchronization with storage events
 * - TypeScript generics for type safety
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ============================================================================
// Utilities
// ============================================================================

let storageCache: Storage | null | undefined;
const TEST_KEY = "__ledger_storage_test__";
const STORAGE_UNAVAILABLE_MESSAGE =
  "Local storage is unavailable. Data will not persist across sessions.";

function getLocalStorage(): Storage | null {
  if (storageCache !== undefined) {
    return storageCache;
  }

  if (typeof window === "undefined" || !window.localStorage) {
    storageCache = null;
    return storageCache;
  }

  try {
    window.localStorage.setItem(TEST_KEY, TEST_KEY);
    window.localStorage.removeItem(TEST_KEY);
    storageCache = window.localStorage;
    return storageCache;
  } catch (error) {
    console.warn("Local storage is not accessible:", error);
    storageCache = null;
    return storageCache;
  }
}
// ============================================================================
// Types
// ============================================================================

interface LocalStoreOptions {
  /** Enable cross-tab synchronization (default: true) */
  enableSync?: boolean;
  /** Show toast notifications on errors (default: true) */
  showToasts?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook for localStorage operations
 * @param key - localStorage key
 * @param options - Optional configuration
 */
export function useLocalStore<T>(
  key: string,
  options: LocalStoreOptions = {}
) {
  const { enableSync = true, showToasts = true } = options;

  // State to hold the stored value
  const [storedValue, setStoredValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Read value from localStorage
   */
  const readValue = useCallback((): T | null => {
    const storage = getLocalStorage();

    if (!storage) {
      setError((prev) => prev ?? STORAGE_UNAVAILABLE_MESSAGE);
      if (showToasts) {
        toast.error(STORAGE_UNAVAILABLE_MESSAGE);
      }
      return null;
    }

    try {
      const item = storage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (err) {
      const errorMessage = `Failed to read from localStorage (key: ${key})`;
      console.error(errorMessage, err);
      setError(errorMessage);
      if (showToasts) {
        toast.error("Failed to load data. Please refresh the page.");
      }
      return null;
    }
  }, [key, showToasts]);

  /**
   * Write value to localStorage
   */
  const writeValue = useCallback(
    (value: T | null): boolean => {
      const storage = getLocalStorage();

      if (!storage) {
        setStoredValue(value);
        setError((prev) => prev ?? STORAGE_UNAVAILABLE_MESSAGE);
        if (showToasts) {
          toast.error(STORAGE_UNAVAILABLE_MESSAGE);
        }
        return false;
      }

      try {
        if (value === null) {
          storage.removeItem(key);
        } else {
          const serialized = JSON.stringify(value);
          storage.setItem(key, serialized);
        }
        setStoredValue(value);
        setError(null);
        return true;
      } catch (err) {
        // Check for quota exceeded error
        if (err instanceof DOMException && err.code === 22) {
          const errorMessage = "Storage is full. Please clear old data.";
          console.error(errorMessage, err);
          setError(errorMessage);
          if (showToasts) {
            toast.error(errorMessage);
          }
        } else {
          const errorMessage = `Failed to save data (key: ${key})`;
          console.error(errorMessage, err);
          setError(errorMessage);
          if (showToasts) {
            toast.error("Failed to save data. Please try again.");
          }
        }
        return false;
      }
    },
    [key, showToasts]
  );

  /**
   * Initialize state from localStorage
   */
  useEffect(() => {
    setLoading(true);
    const value = readValue();
    setStoredValue(value);
    setLoading(false);
  }, [readValue]);

  /**
   * Listen for changes in other tabs (cross-tab sync)
   */
  useEffect(() => {
    if (!enableSync) return;
    if (typeof window === "undefined") return;
    if (!getLocalStorage()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          setStoredValue(newValue);
        } catch (err) {
          console.error("Failed to sync storage change:", err);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, enableSync]);

  /**
   * Set value in localStorage and state
   */
  const setValue = useCallback(
    (value: T | null) => {
      writeValue(value);
    },
    [writeValue]
  );

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback(() => {
    writeValue(null);
  }, [writeValue]);

  /**
   * Update value using a callback (similar to setState)
   */
  const updateValue = useCallback(
    (updater: (prev: T | null) => T | null) => {
      const currentValue = readValue();
      const newValue = updater(currentValue);
      writeValue(newValue);
    },
    [readValue, writeValue]
  );

  return {
    value: storedValue,
    setValue,
    removeValue,
    updateValue,
    loading,
    error,
  };
}



