import { Container } from '@/components/layout/Container';
import { DebtSummaryCards } from '@/components/debts/DebtSummaryCards';
import { RecentActivity } from '@/components/debts/RecentActivity';
import { TopDebtors } from '@/components/debts/TopDebtors';

export function DebtsOverview() {
  return (
    <Container className="py-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Debt Management • Overview</h1>
          <p className="text-muted-foreground mt-1">Summary of outstanding balances and recent activity.</p>
        </div>
      </div>

      <div className="mt-6">
        <DebtSummaryCards />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <TopDebtors />
        </div>
      </div>
    </Container>
  );
}

export default DebtsOverview;
