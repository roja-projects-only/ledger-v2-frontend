            /**
 * useInfiniteScroll - Pagination hook with infinite scroll support
 * 
 * Features:
 * - Chunk-based pagination (load X items at a time)
 * - Infinite scroll with intersection observer
 * - "Load more" button fallback
 * - Reset when data changes
 * - Mobile and desktop support
 * 
 * @param items - Full array of items to paginate
 * @param itemsPerPage - Number of items to show per page (default: 10)
 * @returns Paginated items, loading state, and load more function
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions {
  itemsPerPage?: number;
  autoLoad?: boolean; // Enable intersection observer for auto-loading
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  observerRef: (node: HTMLDivElement | null) => void;
  totalItems: number;
  displayedCount: number;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const { itemsPerPage = 10, autoLoad = true } = options;
  
  const [displayedCount, setDisplayedCount] = useState(itemsPerPage);
  const observer = useRef<IntersectionObserver | null>(null);

  // Reset displayed count when items array changes significantly
  useEffect(() => {
    // Only reset if the new total is less than what we're displaying
    // This prevents reset when items are added
    if (items.length < displayedCount) {
      setDisplayedCount(itemsPerPage);
    }
  }, [items.length, displayedCount, itemsPerPage]);

  // Calculate displayed items
  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  // Load more function
  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayedCount((prev) => Math.min(prev + itemsPerPage, items.length));
    }
  }, [hasMore, itemsPerPage, items.length]);

  // Reset function
  const reset = useCallback(() => {
    setDisplayedCount(itemsPerPage);
  }, [itemsPerPage]);

  // Intersection observer callback ref
  const observerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!autoLoad) return;
      
      // Disconnect previous observer
      if (observer.current) {
        observer.current.disconnect();
      }

      // Create new observer
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          rootMargin: "100px", // Trigger 100px before reaching the element
        }
      );

      // Observe the node
      if (node) {
        observer.current.observe(node);
      }
    },
    [autoLoad, hasMore, loadMore]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    displayedItems,
    hasMore,
    loadMore,
    reset,
    observerRef,
    totalItems: items.length,
    displayedCount,
  };
}
