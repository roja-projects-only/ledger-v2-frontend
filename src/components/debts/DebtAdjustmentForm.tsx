import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/shared/NumberInput';
import { useDebts } from '@/lib/hooks/useDebts';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';

interface DebtAdjustmentFormProps {
  customerId: string;
  currentBalance: number;
  onSuccess?: () => void;
}

export function DebtAdjustmentForm({ customerId, currentBalance, onSuccess }: DebtAdjustmentFormProps) {
  const { createAdjustment } = useDebts();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; reason?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    const nextErrors: { amount?: string; reason?: string } = {};
    if (!val || Math.abs(val) < 0.0001) nextErrors.amount = 'Adjustment amount cannot be zero';
    if (!reason.trim()) nextErrors.reason = 'Reason is required';
    if (val < 0 && Math.abs(val) > currentBalance + 0.001) {
      nextErrors.amount = 'Adjustment would create negative balance';
    }
    if (nextErrors.amount || nextErrors.reason) {
      setErrors(nextErrors);
      toast.error(nextErrors.amount || nextErrors.reason!);
      return;
    }
    setSubmitting(true);
    try {
      await createAdjustment({ customerId, amount: val, reason: reason.trim(), transactionDate: new Date().toISOString(), notes: notes.trim() || undefined });
      toast.success('Adjustment recorded');
      setAmount(''); setReason(''); setNotes('');
      setErrors(null);
      onSuccess?.();
    } catch {
      // handled by mutation toast
    } finally { setSubmitting(false); }
  };

  const projectedBalance = amount ? currentBalance + Number(amount) : currentBalance;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border p-2 text-xs text-muted-foreground">
        Use this to correct the balance. Positive values increase the amount owed; negative values decrease it.
      </div>
      <div className="space-y-2">
        <Label>Adjustment (PHP, negative to reduce) *</Label>
        <NumberInput
          value={amount}
          onChange={(v)=>{ setAmount(v); if (errors) setErrors(null); }}
          step={1}
          aria-label="Adjustment Amount"
          aria-describedby={errors?.amount ? 'adjustment-amount-error' : undefined}
          aria-invalid={!!errors?.amount}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Current: {currentBalance.toLocaleString(undefined,{style:'currency',currency:'PHP'})}</span>
          <span>After adjustment: {projectedBalance.toLocaleString(undefined,{style:'currency',currency:'PHP'})}</span>
        </div>
        {errors?.amount && <p id="adjustment-amount-error" className="text-xs text-destructive" role="alert">{errors.amount}</p>}
      </div>
      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea
          value={reason}
          onChange={(e)=>{ setReason(e.target.value); if (errors) setErrors(null); }}
          rows={2}
          placeholder="Required reason"
          aria-invalid={errors?.reason ? true : undefined}
          aria-describedby={errors?.reason ? 'adjustment-reason-error' : undefined}
        />
        {errors?.reason && <p id="adjustment-reason-error" className="text-xs text-destructive" role="alert">{errors.reason}</p>}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} placeholder="Optional notes" />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        <Wrench className="h-4 w-4 mr-1" /> {submitting ? 'Saving...' : 'Apply Adjustment'}
      </Button>
    </form>
  );
}
