/**
 * useSwipeGesture - Custom hook for detecting swipe gestures
 * 
 * Optimized for mobile sidebar opening:
 * - Detects right swipe from anywhere on screen
 * - Stricter horizontal detection to avoid conflicts
 * - Prevents Safari back gesture conflicts on left edge
 * - Handles touch events properly on iOS/Android
 * - Ignores horizontal scrolling elements
 */

import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  edgeThreshold?: number; // Distance from left edge for special handling (default: 50px)
  swipeThreshold?: number; // Minimum swipe distance (default: 100px)
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeRight,
  edgeThreshold = 50,
  swipeThreshold = 100,
  enabled = true,
}: SwipeGestureOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !onSwipeRight) return;

    const touch = e.touches[0];
    if (!touch) return;

    // Check if target is horizontally scrollable
    const target = e.target as HTMLElement;
    const scrollableParent = findScrollableParent(target);
    if (scrollableParent && scrollableParent.scrollLeft > 0) {
      return;
    }

    // Accept swipes from anywhere on screen
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
  }, [enabled, onSwipeRight]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !onSwipeRight || !touchStartRef.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Detect if this is a horizontal swipe (stricter ratio to avoid conflicts)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 15) {
      isSwipingRef.current = true;
      
      // Prevent default only for horizontal right swipes from left edge
      // This prevents Safari's back gesture on iOS
      if (touchStartRef.current.x < edgeThreshold && deltaX > 0) {
        e.preventDefault();
      }
    }
  }, [enabled, onSwipeRight, edgeThreshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !onSwipeRight || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Calculate swipe velocity
    const velocity = Math.abs(deltaX) / deltaTime;

    // Only trigger if:
    // 1. Swipe is primarily horizontal (stricter 2:1 ratio)
    // 2. Swipe distance meets threshold
    // 3. Swipe direction is right (left to right)
    // 4. Gesture completed quickly (< 500ms)
    // 5. Has minimum velocity OR meets longer distance for slower swipes
    // 6. If from very left edge (< 20px), avoid to prevent Android nav conflicts
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 2; // Strict 2:1 horizontal ratio
    const isRightSwipe = deltaX > swipeThreshold;
    const isQuickEnough = deltaTime < 500;
    const hasGoodVelocity = velocity > 0.25; // Minimum velocity (px/ms)
    const isLongSwipe = deltaX > swipeThreshold * 1.5; // Allow slower but longer swipes
    const notFromVeryEdge = touchStartRef.current.x > 20; // Avoid Android nav gesture

    if (isHorizontal && isRightSwipe && isQuickEnough && (hasGoodVelocity || isLongSwipe) && notFromVeryEdge) {
      onSwipeRight();
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [enabled, onSwipeRight, swipeThreshold]);

  useEffect(() => {
    if (!enabled) return;

    // Use passive: false for touchmove to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}

/**
 * Helper: Find scrollable parent element
 */
function findScrollableParent(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;

  let parent = element.parentElement;
  while (parent) {
    const { overflow, overflowX } = window.getComputedStyle(parent);
    const isScrollable = 
      (overflow === 'auto' || overflow === 'scroll' || 
       overflowX === 'auto' || overflowX === 'scroll') &&
      parent.scrollWidth > parent.clientWidth;

    if (isScrollable) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
