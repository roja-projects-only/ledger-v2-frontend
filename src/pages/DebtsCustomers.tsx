import { Container } from '@/components/layout/Container';

export function DebtsCustomers() {
  return (
    <Container className="py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Debt Management • Customer Debts</h1>
      <p className="text-muted-foreground mt-2">Browse customers with balances, search and filter.</p>
    </Container>
  );
}

export default DebtsCustomers;
