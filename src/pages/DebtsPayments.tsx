import { Container } from '@/components/layout/Container';

export function DebtsPayments() {
  return (
    <Container className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Debt Management • Payment History</h1>
      <p className="text-muted-foreground mt-2">View and filter payments across customers.</p>
    </Container>
  );
}

export default DebtsPayments;
