import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentHistory } from "@/lib/queries/debtsQueries";
import { formatRelativeDate } from "@/lib/utils/dateUtils";
import { useMemo } from "react";

function formatCurrencyPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n ?? 0);
}

function getFromISO(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
}

export function RecentActivity() {
  // IMPORTANT: memoize the filter so the queryKey stays stable and doesn't refetch repeatedly
  const fromISO = useMemo(() => getFromISO(14), []);
  const { data, isLoading, isError } = usePaymentHistory({ from: fromISO });
  const items = data?.data?.slice(0, 10) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-muted-foreground">Failed to load recent activity.</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent payments.</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">₱</div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{it.customerName}</div>
                  <div className="text-xs text-muted-foreground">Paid {formatCurrencyPhp(it.amount)} — {formatRelativeDate(it.date)}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">Left {formatCurrencyPhp(it.remaining)}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
