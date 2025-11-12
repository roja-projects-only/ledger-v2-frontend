import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { DatePicker } from '@/components/date/DatePicker';
import { NumberInput } from '@/components/shared/NumberInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useDebts } from '@/lib/hooks/useDebts';
import { ChevronsUpDown, Check, CalendarDays, ClipboardList, Users, UploadCloud, Layers, Droplet, HandCoins } from 'lucide-react';
import { usePricing } from '@/lib/hooks/usePricing';
import { formatCurrency } from '@/lib/utils';
import { BalancePreview } from '@/components/debts/BalancePreview';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;
type EntryType = 'CHARGE' | 'PAYMENT';

interface LineEntry {
  entryType: EntryType; // CHARGE or PAYMENT
  containers: string; // qty (for CHARGE)
  cashReceived: string; // PHP (for PAYMENT)
  notes: string;
}

export default function PostDayDebtWizard() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { createCharge, createPayment, summary } = useDebts();
  const { getEffectivePrice, calculateTotal } = usePricing();

  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Step 2: single customer selection
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  // Step 3: entry for selected customer
  const [entry, setEntry] = useState<LineEntry>({ entryType: 'CHARGE', containers: '', cashReceived: '', notes: '' });

  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedId), [customers, selectedId]);

  const next = () => setStep((s) => (Math.min(4, (s + 1) as number) as Step));
  const prev = () => setStep((s) => (Math.max(1, (s - 1) as number) as Step));

  const validateStep2 = () => {
    if (!selectedId) {
      toast.error('Please select a customer');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (entry.entryType === 'CHARGE') {
      const containers = Number(entry.containers || '0');
      if (containers <= 0) { toast.error('Enter containers > 0'); return false; }
      if (containers < 0) { toast.error('Values cannot be negative'); return false; }
    } else {
      const cash = Number(entry.cashReceived || '0');
      if (cash <= 0) { toast.error('Enter payment amount > 0'); return false; }
      if (cash < 0) { toast.error('Values cannot be negative'); return false; }
    }
    return true;
  };

  const onNext = () => {
    if (step === 1) {
      if (!date) { toast.error('Pick a date'); return; }
      next();
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      next();
      return;
    }
    if (step === 3) {
      if (!validateStep3()) return;
      next();
      return;
    }
  };

  const onBack = () => prev();

  const toISO = (d?: Date) => (d ? d.toISOString().split('T')[0] : undefined);

  const priorBalances = useMemo(() => {
    const map = new Map<string, number>();
    (summary || []).forEach((s: any) => {
      if (s.customerId) map.set(s.customerId, s.balance);
    });
    return map;
  }, [summary]);

  const reviewRow = useMemo(() => {
    if (!selectedCustomer) return null;
    const type = entry.entryType;
    const unit = getEffectivePrice(selectedCustomer as any);
    const containers = type === 'CHARGE' ? Number(entry.containers || '0') : 0;
    const charge = type === 'CHARGE' ? calculateTotal(containers, selectedCustomer as any) : 0;
    const cash = type === 'PAYMENT' ? Number(entry.cashReceived || '0') : 0;
    const prev = priorBalances.get(selectedCustomer.id) ?? 0;
    const resulting = Math.max(0, prev + charge - cash);
    return {
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      type,
      containers,
      unit,
      charge,
      cash,
      notes: entry.notes || '',
      previousBalance: prev,
      resultingBalance: resulting,
    };
  }, [selectedCustomer, entry, getEffectivePrice, calculateTotal, priorBalances]);

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!date) { toast.error('Pick a date'); return; }
    setSubmitting(true);
    try {
      const isoDate = toISO(date)!;
      if (!selectedCustomer || !reviewRow) { toast.error('Missing selection'); setSubmitting(false); return; }
      if (reviewRow.type === 'CHARGE') {
        await createCharge({ customerId: reviewRow.id, containers: reviewRow.containers, transactionDate: isoDate, notes: reviewRow.notes || undefined });
      } else {
        await createPayment({ customerId: reviewRow.id, amount: reviewRow.cash, transactionDate: isoDate, notes: reviewRow.notes || undefined });
      }
      toast.success('Post day entries recorded');
      navigate('/debts');
    } catch {
      // handled in mutations as well
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-3 sm:p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Post Day (Debts)</h1>
      </div>

      {/* Step Header */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        <Badge variant={step===1?'default':'outline'}><CalendarDays className="h-3 w-3 mr-1" /> Date</Badge>
        <Badge variant={step===2?'default':'outline'}><Users className="h-3 w-3 mr-1" /> Customers</Badge>
        <Badge variant={step===3?'default':'outline'}><ClipboardList className="h-3 w-3 mr-1" /> Entries</Badge>
        <Badge variant={step===4?'default':'outline'}><UploadCloud className="h-3 w-3 mr-1" /> Review</Badge>
      </div>

      {/* Step 1: Date */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Select Date</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <DatePicker value={date} onChange={setDate} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Customer */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Select Customer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:min-w-[260px] justify-between" role="combobox">
                  {!selectedId ? 'Choose customer...' : customers.find(c=>c.id===selectedId)?.name}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(90vw,var(--radix-popover-trigger-width))] max-w-[calc(100vw-2rem)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customer" />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup className="max-h-72 overflow-auto">
                    {customers.map(c => (
                      <CommandItem key={c.id} value={c.name} onSelect={() => { setSelectedId(c.id); setCustomerPopoverOpen(false); }}>
                        <Check className={cn('mr-2 h-4 w-4', selectedId === c.id ? 'opacity-100' : 'opacity-0')} />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Entry */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Enter Entry</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!selectedCustomer && (<div className="text-sm text-muted-foreground">No customer selected.</div>)}
            {selectedCustomer && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{selectedCustomer.name}</div>
                  <div className="text-xs text-muted-foreground">Prev balance: {formatCurrency(priorBalances.get(selectedCustomer.id) ?? 0)}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" className="w-full xs:w-auto sm:w-auto" variant={entry.entryType==='CHARGE'?'default':'outline'} size="sm" onClick={()=>setEntry({ ...entry, entryType:'CHARGE', cashReceived:'' })}>
                    <Droplet className="h-3 w-3 mr-1" /> Charge
                  </Button>
                  <Button type="button" className="w-full xs:w-auto sm:w-auto" variant={entry.entryType==='PAYMENT'?'default':'outline'} size="sm" onClick={()=>setEntry({ ...entry, entryType:'PAYMENT', containers:'' })}>
                    <HandCoins className="h-3 w-3 mr-1" /> Payment
                  </Button>
                </div>
                {entry.entryType === 'CHARGE' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Containers Delivered (qty)</Label>
                      <NumberInput value={entry.containers} onChange={(v)=> setEntry({ ...entry, containers: v })} min={1} step={1} />
                    </div>
                    <div className="md:col-span-2 text-xs text-muted-foreground rounded-md border p-3 min-h-[44px] flex items-center">
                      Unit: {formatCurrency(getEffectivePrice(selectedCustomer as any))} · Charge Preview: {formatCurrency(calculateTotal(Number(entry.containers||'0'), selectedCustomer as any))}
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label>Notes</Label>
                      <Textarea rows={3} value={entry.notes} onChange={(ev)=> setEntry({ ...entry, notes: ev.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cash Received (PHP)</Label>
                      <NumberInput value={entry.cashReceived} onChange={(v)=> setEntry({ ...entry, cashReceived: v })} min={1} step={1} quickValues={[]} />
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                        {(() => {
                          const prev = priorBalances.get(selectedCustomer.id) ?? 0;
                          const base = [50,100,150,200,300,500];
                          const baseValues = Array.from(new Set(base.filter(v=>v<=prev)));
                          return baseValues.map((v)=> (
                            <Button key={v as number} type="button" variant="outline" size="sm" className="flex-1 min-w-[70px]" onClick={()=> setEntry({ ...entry, cashReceived: String(v) })}>
                              {v}
                            </Button>
                          ));
                        })()}
                        </div>
                        <div className="flex gap-2">
                          {(() => {
                            const prev = priorBalances.get(selectedCustomer.id) ?? 0;
                            const half = prev > 0 ? Math.max(1, Math.round(prev/2)) : null;
                            const full = prev > 0 ? prev : null;
                            return (
                              <>
                                {half && (
                                  <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[90px]" onClick={()=> setEntry({ ...entry, cashReceived: String(half) })}>
                                    Half ({half})
                                  </Button>
                                )}
                                {full && (
                                  <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[90px]" onClick={()=> setEntry({ ...entry, cashReceived: String(full) })}>
                                    Settle
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <BalancePreview
                      className="md:col-span-2"
                      current={priorBalances.get(selectedCustomer.id) ?? 0}
                      after={Math.max(0, (priorBalances.get(selectedCustomer.id) ?? 0) - Number(entry.cashReceived||'0'))}
                    />
                    <div className="md:col-span-3 space-y-2">
                      <Label>Notes</Label>
                      <Textarea rows={3} value={entry.notes} onChange={(ev)=> setEntry({ ...entry, notes: ev.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">Date: <b>{date?.toLocaleDateString()}</b></div>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border overflow-x-auto">
              <div className="grid grid-cols-12 gap-3 p-3 text-xs text-muted-foreground min-w-[820px]">
                <div className="col-span-3">Customer</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit / Charge</div>
                <div className="col-span-2 text-right">Cash</div>
                <div className="col-span-1 text-right">Prev</div>
                <div className="col-span-1 text-right">Result</div>
              </div>
              <Separator />
              <div className="divide-y min-w-[820px]">
                {reviewRow && (
                  <div className="grid grid-cols-12 gap-3 p-3 text-sm">
                    <div className="col-span-3 truncate">{reviewRow.name}</div>
                    <div className="col-span-2">{reviewRow.type === 'CHARGE' ? 'Charge' : 'Payment'}</div>
                    <div className="col-span-1 text-right">{reviewRow.containers || '-'}</div>
                    <div className="col-span-2 text-right">{formatCurrency(reviewRow.unit)} / {formatCurrency(reviewRow.charge)}</div>
                    <div className="col-span-2 text-right">{formatCurrency(reviewRow.cash)}</div>
                    <div className="col-span-1 text-right">{formatCurrency(reviewRow.previousBalance)}</div>
                    <div className="col-span-1 text-right font-medium">{formatCurrency(reviewRow.resultingBalance)}</div>
                    {reviewRow.notes && <div className="col-span-12 text-xs text-muted-foreground">Note: {reviewRow.notes}</div>}
                  </div>
                )}
              </div>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {reviewRow && (
                <div className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{reviewRow.name}</div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Type</div><div className="text-right text-foreground">{reviewRow.type === 'CHARGE' ? 'Charge' : 'Payment'}</div>
                    <div>Qty</div><div className="text-right text-foreground">{reviewRow.containers || '-'}</div>
                    <div>Unit</div><div className="text-right text-foreground">{formatCurrency(reviewRow.unit)}</div>
                    <div>Charge</div><div className="text-right text-foreground">{formatCurrency(reviewRow.charge)}</div>
                    <div>Cash</div><div className="text-right text-foreground">{formatCurrency(reviewRow.cash)}</div>
                    <div>Prev</div><div className="text-right text-foreground">{formatCurrency(reviewRow.previousBalance)}</div>
                    <div>Result</div><div className="text-right text-foreground font-medium">{formatCurrency(reviewRow.resultingBalance)}</div>
                  </div>
                  {reviewRow.notes && <div className="mt-2 text-xs text-muted-foreground">Note: {reviewRow.notes}</div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="mx-auto max-w-5xl p-3 flex gap-2">
          <Button className="flex-1 sm:flex-none" variant="outline" onClick={onBack} disabled={step===1}>Back</Button>
          {step < 4 ? (
            <Button className="flex-1 sm:flex-none" onClick={onNext}>Next</Button>
          ) : (
            <Button className="flex-1 sm:flex-none" onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit All'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
