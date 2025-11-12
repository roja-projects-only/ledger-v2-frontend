import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/shared/NumberInput';
import { useDebts } from '@/lib/hooks/useDebts';
import { useCustomerList } from '@/lib/hooks/useCustomers';
import { formatCurrency, cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import { LocationBadge } from '@/components/shared/LocationBadge';
import { usePricing } from '@/lib/hooks/usePricing';
import { toast } from 'sonner';

interface DebtChargeFormProps {
  onSuccess?: () => void;
  defaultCustomerId?: string;
  date?: string; // ISO date override (defaults to today)
}

export function DebtChargeForm({ onSuccess, defaultCustomerId, date }: DebtChargeFormProps) {
  const { customers } = useCustomerList();
  const { createCharge } = useDebts();
  const { getEffectivePrice, calculateTotal } = usePricing();
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [containers, setContainers] = useState('');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containersRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const unitPrice = getEffectivePrice(selectedCustomer);
  const amount = containers && !isNaN(Number(containers)) ? calculateTotal(Number(containers), selectedCustomer) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId) { setError('Select a customer'); toast.error('Select a customer'); return; }
    const cnt = Number(containers);
    if (!cnt || cnt <= 0) { setError('Enter containers > 0'); toast.error('Enter containers > 0'); return; }
    setSubmitting(true);
    try {
      await createCharge({ customerId, containers: cnt, transactionDate: (date || new Date().toISOString()), notes: notes.trim() || undefined });
      toast.success('Charge added');
      setContainers('');
      setNotes('');
      onSuccess?.();
      setTimeout(()=>containersRef.current?.focus(),100);
    } catch {
      // handled by mutation toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Customer *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between">
              {selectedCustomer ? (
                <span className="flex items-center w-full justify-between gap-2">
                  <span className="truncate">{selectedCustomer.name}</span>
                  <LocationBadge location={selectedCustomer.location} size="sm" />
                </span>
              ) : 'Select customer...'}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search customer" />
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {customers.map(c => (
                  <CommandItem key={c.id} value={c.name} onSelect={() => { setCustomerId(c.id); setOpen(false); setTimeout(()=>containersRef.current?.focus(),80); }}>
                    <Check className={cn('mr-2 h-4 w-4', customerId===c.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex items-center gap-2 justify-between w-full">
                      <span className="truncate">{c.name}</span>
                      <LocationBadge location={c.location} size="sm" />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2">
        <Label>Containers (qty of water containers) *</Label>
        <NumberInput
          value={containers}
          onChange={(v)=>{ setContainers(v); if(error) setError(null); }}
          min={1}
          step={1}
          inputRef={containersRef}
          aria-label="Containers"
          aria-describedby={error ? 'charge-error' : undefined}
          aria-invalid={!!error}
        />
        {error && <p id="charge-error" className="text-xs text-destructive mt-1" role="alert">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} placeholder="Optional notes" />
      </div>
      {selectedCustomer && (
        <div className="rounded-md border p-2 text-xs text-muted-foreground space-y-1">
          <div><strong>Pricing Preview:</strong> {containers || 0} × {formatCurrency(unitPrice || 0)} = {formatCurrency(amount)}</div>
          <div>Each container priced using customer/unit settings. Final authoritative price stored server-side.</div>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>{submitting? 'Saving...' : (<><Plus className="h-4 w-4 mr-1" /> Add Charge</>)}</Button>
    </form>
  );
}
