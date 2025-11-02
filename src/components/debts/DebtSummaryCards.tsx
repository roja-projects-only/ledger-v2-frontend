import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebtSummary } from "@/lib/queries/debtsQueries";

function formatCurrencyPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(n ?? 0);
}

export function DebtSummaryCards() {
  const { data, isLoading, isError } = useDebtSummary();
  const summary = data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle><Skeleton className="h-6 w-32" /></CardTitle><CardDescription><Skeleton className="h-4 w-24 mt-2"/></CardDescription></CardHeader><CardContent><Skeleton className="h-8 w-40" /></CardContent></Card>
        <Card><CardHeader><CardTitle><Skeleton className="h-6 w-32" /></CardTitle><CardDescription><Skeleton className="h-4 w-24 mt-2"/></CardDescription></CardHeader><CardContent><Skeleton className="h-8 w-24" /></CardContent></Card>
        <Card><CardHeader><CardTitle><Skeleton className="h-6 w-32" /></CardTitle><CardDescription><Skeleton className="h-4 w-24 mt-2"/></CardDescription></CardHeader><CardContent><Skeleton className="h-8 w-40" /></CardContent></Card>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Error</CardTitle><CardDescription>Could not load summary</CardDescription></CardHeader><CardContent><div className="text-muted-foreground">Retry later</div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Outstanding</CardTitle>
          <CardDescription>Sum of all balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{formatCurrencyPhp(summary.totalOutstanding)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Debtors</CardTitle>
          <CardDescription>Customers with balance &gt; 0</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{summary.activeDebtors}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payments (This Week)</CardTitle>
          <CardDescription>Sum of recorded payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{formatCurrencyPhp(summary.weeklyPaymentAmount)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DebtSummaryCards;
