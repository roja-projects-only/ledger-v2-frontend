/**
 * CollectionStatusBadge - Display collection status with appropriate styling
 *
 * Features:
 * - Status-based styling (Active, Overdue, Suspended)
 * - Consistent color schemes matching design system
 * - Proper TypeScript interfaces
 * - Customizable className support
 */

import { Badge } from "@/components/ui/badge";
import type { CollectionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface CollectionStatusBadgeProps {
  status: CollectionStatus;
  className?: string;
}

// ============================================================================
// Collection Status Badge Component
// ============================================================================

export function CollectionStatusBadge({ status, className }: CollectionStatusBadgeProps) {
  const getStatusConfig = (status: CollectionStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "OVERDUE":
        return {
          label: "Overdue",
          variant: "default" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "SUSPENDED":
        return {
          label: "Suspended",
          variant: "destructive" as const,
          className: "",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}