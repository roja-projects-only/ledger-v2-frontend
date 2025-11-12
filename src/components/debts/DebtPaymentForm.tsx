import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/shared/NumberInput';
import { useDebts } from '@/lib/hooks/useDebts';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { BalancePreview } from './BalancePreview';

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
  const numericBalance = currentBalance || 0;
  const basePresets = [50,100,150,200,300,500];
  const filteredPresets = basePresets.filter(p=>p <= numericBalance && p>=50); // only show relevant amounts
  const half = numericBalance > 0 ? Math.max(1, Math.round(numericBalance/2)) : null;
  const full = numericBalance > 0 ? numericBalance : null;
  const uniquePresetValues = Array.from(new Set([...filteredPresets, half, full].filter(Boolean)));

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
          min={1}
          step={1}
          quickValues={[]}
          aria-label="Payment Amount"
          aria-describedby={error ? 'payment-error' : undefined}
          aria-invalid={!!error}
        />
        {uniquePresetValues.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {uniquePresetValues.filter(v=> v !== full && v !== half).map(v => (
                <Button key={v} type="button" variant="outline" size="sm" className="flex-1 min-w-[70px]" onClick={()=>{ setAmount(String(v)); if(error) setError(null); }}>
                  {v}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {half && (
                <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[90px]" onClick={()=>{ setAmount(String(half)); if(error) setError(null); }}>
                  Half ({half})
                </Button>
              )}
              {full && (
                <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[90px]" onClick={()=>{ setAmount(String(full)); if(error) setError(null); }}>
                  Settle
                </Button>
              )}
            </div>
          </div>
        )}
        <BalancePreview current={currentBalance} after={projectedBalance} />
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
