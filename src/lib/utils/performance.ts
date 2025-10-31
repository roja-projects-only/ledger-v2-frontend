/**
 * Performance utilities for monitoring and optimizing component performance
 */

import { useEffect, useRef } from "react";

type PropsRecord = Record<string, unknown>;

/**
 * Hook to track component re-renders in development
 * Logs when a component re-renders and what props changed
 */
export function useRenderTracker<Props extends PropsRecord = PropsRecord>(
  componentName: string,
  props?: Props
) {
  const renderCount = useRef(0);
  const prevProps = useRef<Props | undefined>(undefined);

  useEffect(() => {
    renderCount.current += 1;
    const isBrowser = typeof window !== "undefined";

    if (isBrowser && import.meta.env.DEV) {
      console.log(`[${componentName}] Render #${renderCount.current}`);

      if (props && prevProps.current) {
        const keys = Object.keys(props) as Array<keyof Props>;
        const changedProps = keys.filter((key) => props[key] !== prevProps.current?.[key]);

        if (changedProps.length > 0) {
          console.log(`[${componentName}] Changed props:`, changedProps);
        }
      }
    }

    prevProps.current = props;
  });
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string) {
  const startTime = useRef<number | undefined>(undefined);
  
  // Mark start of render
  startTime.current = performance.now();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV && startTime.current) {
      const renderTime = performance.now() - startTime.current;
      if (renderTime > 16) { // Only log if render takes longer than 16ms (60fps threshold)
        console.warn(`[${componentName}] Slow render: ${renderTime.toFixed(2)}ms`);
      }
    }
  });
}

/**
 * Utility to create a memoized selector for expensive computations
 */
export function createMemoizedSelector<T, R>(
  selector: (input: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  let lastInput: T | undefined;
  let lastResult: R | undefined;
  let hasCachedValue = false;

  return (input: T): R => {
    if (!hasCachedValue || input !== lastInput) {
      const newResult = selector(input);

      const shouldUpdate =
        !hasCachedValue || !equalityFn || !equalityFn(lastResult as R, newResult);

      if (shouldUpdate) {
        lastResult = newResult;
      }

      lastInput = input;
      hasCachedValue = true;
    }

    return lastResult as R;
  };
}