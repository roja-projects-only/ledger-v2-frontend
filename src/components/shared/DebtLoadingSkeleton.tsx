/**
 * DebtLoadingSkeleton - Loading skeleton components for debt-related UI
 * 
 * Provides consistent loading states for debt information sections
 * including KPI cards, management actions, and status indicators.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Components
// ============================================================================

/**
 * Skeleton for debt management actions section
 */
export function DebtManagementSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for outstanding balance KPI card
 */
export function DebtKPISkeleton() {
  return (
    <Card className="h-full border-2">
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

/**
 * Skeleton for collection status badge
 */
export function CollectionStatusSkeleton() {
  return <Skeleton className="h-5 w-16 rounded-full" />;
}

/**
 * Combined skeleton for the entire debt section
 */
export function DebtSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* KPI Skeleton - only show if it would be in the KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-2 lg:col-span-1">
          <DebtKPISkeleton />
        </div>
      </div>
      
      {/* Management Actions Skeleton */}
      <DebtManagementSkeleton />
    </div>
  );
}