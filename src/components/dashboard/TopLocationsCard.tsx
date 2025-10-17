/**
 * TopLocationsCard Component
 * 
 * ⚠️ PRICING: Receives pre-calculated revenue from useDashboardData
 * - Revenue already respects enableCustomPricing toggle
 * - Data calculated via analytics utilities with getEffectivePriceFromData()
 * - See: src/lib/hooks/useDashboardData.ts and docs/PRICING_GUIDE.md
 * 
 * Displays top 5 performing locations with revenue metrics.
 * 
 * Features:
 * - Ranked list with visual indicators
 * - Progress bars showing relative performance
 * - "View All" button navigation to locations page
 * - Loading state support
 */

import { LocationRow } from "./LocationRow";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LocationStats } from "@/lib/utils/analytics";

// ============================================================================
// Types
// ============================================================================

export interface TopLocationsCardProps {
  /** Top location statistics (pre-sorted, top 5) */
  locations: LocationStats[];
  /** Optional loading state */
  loading?: boolean;
  /** Optional callback for "View All" button */
  onViewAll?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function TopLocationsCard({
  locations,
  loading = false,
  onViewAll,
}: TopLocationsCardProps) {
  // Get max revenue for progress bar calculation
  const maxRevenue = locations.length > 0 ? locations[0].revenue : 0;

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            Top Locations
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Highest performing areas this month
          </p>
        </div>

        {onViewAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="text-xs"
          >
            View All
          </Button>
        )}
      </div>

      {/* Location List */}
      <div className="space-y-4">
        {locations.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No location data available
            </p>
          </div>
        ) : (
          locations.map((location, index) => (
            <LocationRow
              key={location.location}
              location={location}
              rank={index + 1}
              maxRevenue={maxRevenue}
            />
          ))
        )}
      </div>
    </div>
  );
}
