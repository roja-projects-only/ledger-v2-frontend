/**
 * DebtManagementSection - Enhanced debt management actions with error handling
 * 
 * Provides debt management buttons with proper error states, loading states,
 * and fallback UI when debt service is unavailable.
 */

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, CreditCard, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { CollectionStatusBadge } from "@/components/shared/CollectionStatusBadge";
import { DebtManagementSkeleton } from "@/components/shared/DebtLoadingSkeleton";
import type { OutstandingBalance } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface DebtManagementSectionProps {
  outstandingBalance: OutstandingBalance | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isDebtServiceAvailable: boolean;
  onViewDebtHistory: () => void;
  onRecordPayment: () => void;
  onRetry: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const DebtManagementSection = memo(function DebtManagementSection({
  outstandingBalance,
  isLoading,
  isError,
  error,
  isDebtServiceAvailable,
  onViewDebtHistory,
  onRecordPayment,
  onRetry,
}: DebtManagementSectionProps) {
  // Loading state
  if (isLoading) {
    return <DebtManagementSkeleton />;
  }

  // Error state - debt service unavailable
  if (isError && !isDebtServiceAvailable) {
    return (
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <WifiOff className="h-4 w-4" />
            Debt Service Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              The debt management service is temporarily unavailable. 
              You can still view purchase history, but debt information may not be current.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state - other errors
  if (isError) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Failed to Load Debt Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || "An unexpected error occurred while loading debt information."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - normal debt management
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Debt Management</span>
          {outstandingBalance && (
            <CollectionStatusBadge status={outstandingBalance.collectionStatus} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onViewDebtHistory}
            variant="outline"
            className="flex-1"
          >
            <Receipt className="h-4 w-4 mr-2" />
            View Debt History
          </Button>
          <Button
            onClick={onRecordPayment}
            className="flex-1"
            disabled={!outstandingBalance || outstandingBalance.totalOwed <= 0}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
        {outstandingBalance && outstandingBalance.totalOwed <= 0 && (
          <div className="mt-3 text-sm text-muted-foreground text-center">
            This customer has no outstanding balance
          </div>
        )}
      </CardContent>
    </Card>
  );
});