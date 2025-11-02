/**
 * KPICard - Reusable component for displaying key performance indicator metrics
 * 
 * Features:
 * - Displays label, value, icon, and optional trend indicator
 * - Loading skeleton state
 * - Responsive design
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getKPIVariant, type KPIVariant } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  variant?: KPIVariant;
  loading?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  variant,
  loading = false,
  className,
}: KPICardProps) {
  const theme = variant ? getKPIVariant(variant) : null;
  const cardClasses = cn(
    "h-full gap-0 sm:gap-0",
    theme && "border-2",
    theme?.bg,
    theme?.border,
    className,
  );

  if (loading) {
    return (
      <Card className={cardClasses}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-8 w-32 mb-2" />
          {trend && <Skeleton className="h-3 w-16" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={cn(
                "p-1.5 rounded-md",
                theme?.iconBg ?? "bg-primary/10",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  theme?.icon ?? "text-primary",
                )}
              />
            </div>
          )}
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p
            className={cn(
              "text-xs mt-0.5",
              trend.direction === "up" && "text-green-600",
              trend.direction === "down" && "text-red-600",
              trend.direction === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.direction === "up" && "↑ "}
            {trend.direction === "down" && "↓ "}
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
