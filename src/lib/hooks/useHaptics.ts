import { useCallback } from 'react';

// Vibration patterns (in milliseconds)
const PATTERNS = {
  success: [20], // Short single tap
  error: [50, 30, 50], // Double tap with pause
  warning: [100], // Longer single tap
  light: [10], // Very subtle
  selection: [5], // Ultra-light tap
} as const;

type HapticType = keyof typeof PATTERNS;

export function useHaptics() {
  const vibrate = useCallback((type: HapticType) => {
    // Check if vibration API is supported
    if (!('vibrate' in navigator)) {
      return;
    }

    try {
      navigator.vibrate(PATTERNS[type]);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  const isSupported = 'vibrate' in navigator;

  return { vibrate, isSupported };
}
