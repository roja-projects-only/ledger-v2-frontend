/**
 * useSwipeGesture - Custom hook for detecting swipe gestures
 * 
 * Optimized for mobile sidebar opening:
 * - Only detects right swipe from left edge (0-50px)
 * - Prevents Safari back gesture conflicts
 * - Handles touch events properly on iOS/Android
 * - Ignores horizontal scrolling elements
 */

import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  edgeThreshold?: number; // Distance from left edge to trigger (default: 50px)
  swipeThreshold?: number; // Minimum swipe distance (default: 80px)
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeRight,
  edgeThreshold = 50,
  swipeThreshold = 80,
  enabled = true,
}: SwipeGestureOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !onSwipeRight) return;

    const touch = e.touches[0];
    if (!touch) return;

    // Only detect swipes starting from left edge
    if (touch.clientX > edgeThreshold) {
      return;
    }

    // Check if target is horizontally scrollable
    const target = e.target as HTMLElement;
    const scrollableParent = findScrollableParent(target);
    if (scrollableParent && scrollableParent.scrollLeft > 0) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
  }, [enabled, onSwipeRight, edgeThreshold]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !onSwipeRight || !touchStartRef.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Detect if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwipingRef.current = true;
      
      // Prevent default only for horizontal swipes from edge
      // This prevents Safari's back gesture
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
    // 1. Started from left edge area
    // 2. Swipe is primarily horizontal (not vertical) - stricter ratio
    // 3. Swipe distance meets threshold
    // 4. Swipe direction is right
    // 5. Gesture completed quickly (< 400ms) with good velocity
    // 6. Avoid very edge (< 20px) to prevent Android nav conflicts
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.5; // Stricter horizontal requirement
    const isFromEdge = touchStartRef.current.x < edgeThreshold && touchStartRef.current.x > 20;
    const isRightSwipe = deltaX > swipeThreshold;
    const isQuickEnough = deltaTime < 400;
    const hasGoodVelocity = velocity > 0.3; // Minimum velocity (px/ms)

    if (isFromEdge && isHorizontal && isRightSwipe && isQuickEnough && hasGoodVelocity) {
      onSwipeRight();
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
  }, [enabled, onSwipeRight, edgeThreshold, swipeThreshold]);

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
