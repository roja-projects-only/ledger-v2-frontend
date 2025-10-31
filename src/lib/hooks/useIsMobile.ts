import { useCallback, useEffect, useState } from "react";

const DEFAULT_BREAKPOINT = 768;

/**
 * Responsive utility hook that returns whether the current viewport width
 * is below the provided breakpoint. Defaults to treating widths under 768px
 * as mobile. The hook is safe for SSR and keeps the value in sync on resize.
 */
export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const getIsMobile = useCallback(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
    [breakpoint]
  );

  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobile());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint, getIsMobile]);

  return isMobile;
}
