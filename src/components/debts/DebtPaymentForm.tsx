import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/shared/NumberInput';
import { useDebts } from '@/lib/hooks/useDebts';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface DebtPaymentFormProps {
  customerId: string;
  currentBalance: number;
  onSuccess?: () => void;
}

export function DebtPaymentForm({ customerId, currentBalance, onSuccess }: DebtPaymentFormProps) {
  const { createPayment } = useDebts();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    setError(null);
    if (!val || val <= 0) { setError('Enter payment amount > 0'); toast.error('Enter payment amount > 0'); return; }
    if (val > currentBalance + 0.001) { setError('Overpayment is not allowed'); toast.error('Overpayment is not allowed'); return; }
    setSubmitting(true);
    try {
      await createPayment({ customerId, amount: val, transactionDate: new Date().toISOString(), notes: notes.trim() || undefined });
      toast.success('Payment recorded');
      setAmount('');
      setNotes('');
      onSuccess?.();
    } catch {
      // handled by mutation toast
    } finally {
      setSubmitting(false);
    }
  };

  const projectedBalance = amount ? Math.max(0, currentBalance - Number(amount)) : currentBalance;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border p-2 text-xs text-muted-foreground">
        This form records a cash payment in PHP. It reduces the customer debt balance.
      </div>
      <div className="space-y-2">
        <Label>Cash Payment (PHP) *</Label>
        <NumberInput
          value={amount}
          onChange={(v)=>{ setAmount(v); if(error) setError(null); }}
          min={0.01}
          step={1}
          aria-label="Payment Amount"
          aria-describedby={error ? 'payment-error' : undefined}
          aria-invalid={!!error}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Current: {currentBalance.toLocaleString(undefined, { style:'currency', currency:'PHP' })}</span>
          <span>After payment: {projectedBalance.toLocaleString(undefined, { style:'currency', currency:'PHP' })}</span>
        </div>
        {error && <p id="payment-error" className="text-xs text-destructive" role="alert">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} placeholder="Optional notes" />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        <CheckCircle2 className="h-4 w-4 mr-1" /> {submitting ? 'Saving...' : 'Record Payment'}
      </Button>
    </form>
  );
}
