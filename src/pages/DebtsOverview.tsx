import { Container } from '@/components/layout/Container';

export function DebtsOverview() {
  return (
    <Container className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Debt Management • Overview</h1>
      <p className="text-muted-foreground mt-2">Summary of outstanding balances and recent activity.</p>
    </Container>
  );
}

export default DebtsOverview;
