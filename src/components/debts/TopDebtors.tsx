import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerDebts } from "@/lib/queries/debtsQueries";

function formatCurrencyPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n ?? 0);
}

function StatusDot({ status }: { status: 'UNPAID' | 'PARTIAL' | 'CLEARED' }) {
  const color = status === 'CLEARED' ? 'bg-green-500' : status === 'PARTIAL' ? 'bg-yellow-500' : 'bg-red-500';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
}

export function TopDebtors() {
  const { data, isLoading, isError } = useCustomerDebts({ page: 1, limit: 100 });
  const sorted = (data?.data ?? []).slice().sort((a, b) => b.currentBalance - a.currentBalance);
  const top = sorted.filter(x => x.currentBalance > 0).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Debtors</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-muted-foreground">Failed to load top debtors.</div>
        ) : top.length === 0 ? (
          <div className="text-sm text-muted-foreground">No outstanding balances.</div>
        ) : (
          <ul className="space-y-2">
            {top.map((c) => (
              <li key={c.customerId} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusDot status={c.status} />
                  <span className="truncate max-w-[14rem]" title={c.customerName}>{c.customerName}</span>
                </div>
                <div className="font-medium">{formatCurrencyPhp(c.currentBalance)}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default TopDebtors;
