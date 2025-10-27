/**
 * DebtKPICard - Enhanced KPI card specifically for debt information
 * 
 * Provides specialized handling for debt-related KPIs with error states,
 * loading states, and fallback UI when debt service is unavailable.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { getSemanticColor } from "@/lib/colors";
import { formatCurrency, cn } from "@/lib/utils";
import type { OutstandingBalance } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface DebtKPICardProps {
  outstandingBalance: OutstandingBalance | null;
  isLoading: boolean;
  isError: boolean;
  isDebtServiceAvailable: boolean;
  onRetry: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DebtKPICard({
  outstandingBalance,
  isLoading,
  isError,
  isDebtServiceAvailable,
  onRetry,
  className,
}: DebtKPICardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("h-full border-2", className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Error state - debt service unavailable
  if (isError && !isDebtServiceAvailable) {
    const theme = getSemanticColor("warning");
    
    return (
      <Card className={cn("h-full border-2", theme.bg, theme.border, className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", "bg-amber-500/15")}>
              <WifiOff className={cn("h-3.5 w-3.5", theme.icon)} />
            </div>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Outstanding Balance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Service Unavailable
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state - other errors
  if (isError) {
    const theme = getSemanticColor("error");
    
    return (
      <Card className={cn("h-full border-2", theme.bg, theme.border, className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", "bg-red-500/15")}>
              <AlertCircle className={cn("h-3.5 w-3.5", theme.icon)} />
            </div>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Outstanding Balance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Load Failed
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success state - no debt
  if (!outstandingBalance || outstandingBalance.totalOwed <= 0) {
    const theme = getSemanticColor("success");
    
    return (
      <Card className={cn("h-full border-2", theme.bg, theme.border, className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", "bg-green-500/15")}>
              <CheckCircle className={cn("h-3.5 w-3.5", theme.icon)} />
            </div>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Outstanding Balance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="text-2xl font-bold">₱0.00</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            No outstanding debt
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success state - has debt
  const daysPastDue = outstandingBalance.daysPastDue || 0;
  
  // Determine semantic tone and icon based on debt status
  let semanticTone: "warning" | "error" = "warning";
  let IconComponent = AlertCircle;
  let iconBgClass = "bg-amber-500/15";
  
  if (daysPastDue > 60) {
    semanticTone = "error";
    IconComponent = AlertTriangle;
    iconBgClass = "bg-red-500/15";
  } else if (daysPastDue > 30) {
    semanticTone = "warning";
    IconComponent = AlertCircle;
    iconBgClass = "bg-amber-500/15";
  }
  
  const theme = getSemanticColor(semanticTone);
  
  return (
    <Card className={cn("h-full border-2", theme.bg, theme.border, className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", iconBgClass)}>
            <IconComponent className={cn("h-3.5 w-3.5", theme.icon)} />
          </div>
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Outstanding Balance
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-2xl font-bold">
          {formatCurrency(outstandingBalance.totalOwed)}
        </div>
        {daysPastDue > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {daysPastDue} days overdue
          </p>
        )}
      </CardContent>
    </Card>
  );
}