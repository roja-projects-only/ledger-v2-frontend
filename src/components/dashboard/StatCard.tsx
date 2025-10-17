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

  if (loading) {
    return (
      <Card className={cn("h-full gap-0", className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full gap-0", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          {/* Icon Badge */}
          <div
            className={cn(
              "p-2 rounded-md",
              theme.iconBg
            )}
          >
            <Icon className={cn("h-4 w-4", theme.icon)} />
          </div>
          
          {/* Label */}
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {/* Large Value */}
        <p className="text-3xl font-bold">
          {value}
        </p>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-1">
          <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
          <p className={cn("text-sm font-medium", trendColor)}>
            {Math.abs(trend.percentage).toFixed(1)}% {trend.label}
          </p>
        </div>
        
        {/* Mini Sparkline */}
        <div className="pt-1">
          <MiniSparkline
            data={sparklineData}
            color={sparklineColor}
            width={120}
            height={24}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Export memoized version for performance
export default memo(StatCard);
