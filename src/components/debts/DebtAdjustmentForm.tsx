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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || Math.abs(val) < 0.0001) return toast.error('Adjustment amount cannot be zero');
    if (!reason.trim()) return toast.error('Reason is required');
    // Negative adjustment reduces balance; ensure not below zero
    if (val < 0 && Math.abs(val) > currentBalance + 0.001) {
      return toast.error('Adjustment would create negative balance');
    }
    setSubmitting(true);
    try {
      await createAdjustment({ customerId, amount: val, reason: reason.trim(), transactionDate: new Date().toISOString(), notes: notes.trim() || undefined });
      toast.success('Adjustment recorded');
      setAmount(''); setReason(''); setNotes('');
      onSuccess?.();
    } catch {
      // handled by mutation toast
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Adjustment Amount * (use negative to reduce)</Label>
        <NumberInput value={amount} onChange={setAmount} step={1} />
        <p className="text-xs text-muted-foreground">Current Balance: {currentBalance.toLocaleString(undefined,{style:'currency',currency:'PHP'})}</p>
      </div>
      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea value={reason} onChange={(e)=>setReason(e.target.value)} rows={2} placeholder="Required reason" />
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
