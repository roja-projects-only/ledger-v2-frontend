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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return toast.error('Enter payment amount > 0');
    if (val > currentBalance + 0.001) return toast.error('Overpayment is not allowed');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Payment Amount *</Label>
        <NumberInput value={amount} onChange={setAmount} min={0.01} step={1} />
        <p className="text-xs text-muted-foreground">Balance: {currentBalance.toLocaleString(undefined, { style:'currency', currency:'PHP' })}</p>
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
