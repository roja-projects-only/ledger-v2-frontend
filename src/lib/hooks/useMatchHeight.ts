import { useEffect, useState, type RefObject } from 'react';

/**
 * Hook to match the height of one element to another
 * Useful for making sibling elements in a grid have equal heights
 * 
 * @param targetRef - Ref to the element whose height we want to measure
 * @param dependencies - Array of dependencies that should trigger height recalculation
 * @returns The measured height in pixels, or undefined if not yet measured
 */
export function useMatchHeight(
  targetRef: RefObject<HTMLElement | null>,
  dependencies: unknown[] = []
): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateHeight = () => {
      if (targetRef.current) {
        const measuredHeight = targetRef.current.offsetHeight;
        setHeight(measuredHeight);
      }
    };

    // Delay initial measurement to ensure DOM is ready
    const timeoutId = setTimeout(updateHeight, 0);

    // Create ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (targetRef.current) {
      resizeObserver.observe(targetRef.current);
    }

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [targetRef, ...dependencies]);

  return height;
}
