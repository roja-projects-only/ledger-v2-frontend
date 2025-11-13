/**
 * StatCard - Enhanced KPI card with sparkline and trend indicator
 * 
 * ⚠️ PRICING: Receives pre-calculated metrics from useDashboardData
 * - Revenue/values already respect enableCustomPricing toggle
 * - Data calculated via analytics utilities with getEffectivePriceFromData()
 * - See: src/lib/hooks/useDashboardData.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Icon badge with colored background
 * - Large metric value
 * - Trend indicator (arrow + percentage + comparison text)
 * - Mini sparkline showing 7-day trend
 * - Loading skeleton state
 * - Memoized for performance optimization
 */

import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MiniSparkline } from "./MiniSparkline";
import type { LucideIcon } from "lucide-react";
import type { KPIVariant } from "@/lib/types";
import type { DailyMetric } from "@/lib/utils/analytics";
import { getKPIVariant } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant: KPIVariant;
  trend: {
    direction: "up" | "down" | "neutral";
    percentage: number;
    label: string; // e.g., "vs last month"
  };
  sparklineData: DailyMetric[];
  loading?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  trend,
  sparklineData,
  loading = false,
  className,
}: StatCardProps) {
  const theme = getKPIVariant(variant);
  
  // Determine trend color and icon
  const trendColor = 
    trend.direction === "up" 
      ? "text-emerald-500" 
      : trend.direction === "down"
      ? "text-red-500"
      : "text-slate-400";
  
  const TrendIcon = 
    trend.direction === "up" 
      ? TrendingUp 
      : trend.direction === "down"
      ? TrendingDown
      : Minus;

  // Get sparkline color from variant
  const sparklineColor = (() => {
    switch (variant) {
      case "revenue":
        return "rgb(16, 185, 129)"; // emerald-500
      case "quantity":
        return "rgb(14, 165, 233)"; // sky-500
      case "average":
        return "rgb(245, 158, 11)"; // amber-500
      case "customers":
        return "rgb(168, 85, 247)"; // purple-500
      default:
        return "rgb(14, 165, 233)"; // sky-500
    }
  })();

  // Apply KPI color theme to card
  const cardClasses = cn(
    // Keep cards compact on mobile to avoid tall rectangles
    "h-full gap-0 sm:gap-0 min-h-[92px] sm:min-h-[110px]",
    "border-2",
    theme.bg,
    theme.border,
    className,
  );

  if (loading) {
    return (
      <Card className={cardClasses}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-1 sm:pb-2">
        <div className="flex items-center gap-2">
          {/* Icon Badge */}
          <div
            className={cn(
              "p-1.5 sm:p-2 rounded-md",
              theme.iconBg
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", theme.icon)} />
          </div>
          
          {/* Label */}
          <h3 className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-1.5 sm:space-y-2">
        {/* Large Value */}
        <p className="text-2xl sm:text-3xl font-bold leading-tight">
          {value}
        </p>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-1">
          <TrendIcon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", trendColor)} />
          <p className={cn("text-xs sm:text-sm font-medium", trendColor)}>
            {Math.abs(trend.percentage).toFixed(1)}% {trend.label}
          </p>
        </div>
        
        {/* Mini Sparkline */}
        <div className="pt-1 sm:pt-2 -mx-2">
          <MiniSparkline
            data={sparklineData}
            color={sparklineColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized version for performance
export default memo(StatCard);
