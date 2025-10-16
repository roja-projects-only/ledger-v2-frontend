/**
 * Container - Page container with max-width constraint
 * 
 * Features:
 * - Responsive max-width
 * - Centered content
 * - Padding for mobile
 */

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
