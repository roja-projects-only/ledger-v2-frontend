/**
 * useDebounce - Hook for debouncing values to prevent excessive API calls
 * 
 * Delays updating the debounced value until after the specified delay
 * has passed since the last time the input value changed.
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}