/**
 * DateSummaryCard - Display summary metrics for selected date
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - Recalculates revenue using getEffectivePrice()
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Shows entry count, total revenue, containers sold, average per entry
 * - Loading skeleton state
 * - Formatted currency values
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, DollarSign, Package, TrendingUp } from "lucide-react";
import type { Sale } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { usePricing } from "@/lib/hooks/usePricing";
import { useCustomerList } from "@/lib/hooks/useCustomers";

// ============================================================================
// Types
// ============================================================================

interface DateSummaryCardProps {
  sales: Sale[];
  loading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DateSummaryCard({ sales, loading = false }: DateSummaryCardProps) {
  const { customers } = useCustomerList();
  const { getEffectivePrice } = usePricing();

  // Calculate metrics with effective pricing
  const entriesCount = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => {
    const customer = customers?.find((c) => c.id === sale.customerId);
    if (!customer) return sum + sale.total; // Fallback to stored total
    const effectivePrice = getEffectivePrice(customer);
    return sum + sale.quantity * effectivePrice;
  }, 0);
  const totalContainers = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const averagePerEntry = entriesCount > 0 ? totalRevenue / entriesCount : 0;

  const metrics = [
    {
      label: "Entries",
      value: entriesCount,
      icon: Receipt,
      format: (val: number) => val.toString(),
    },
    {
      label: "Revenue",
      value: totalRevenue,
      icon: DollarSign,
      format: formatCurrency,
    },
    {
      label: "Containers",
      value: totalContainers,
      icon: Package,
      format: (val: number) => val.toString(),
    },
    {
      label: "Avg/Entry",
      value: averagePerEntry,
      icon: TrendingUp,
      format: formatCurrency,
    },
  ];

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2 min-w-0">
                <Skeleton className="h-4 w-16 sm:w-20" />
                <Skeleton className="h-6 w-20 sm:w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{metric.label}</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold truncate">
                  {metric.format(metric.value)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
