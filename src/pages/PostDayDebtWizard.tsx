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
import { ChevronsUpDown, Check, CalendarDays, ClipboardList, Users, UploadCloud, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

interface LineEntry {
  containers: string; // number string
  payment: string; // number string
  notes: string;
  finalMode: boolean; // Quick Final State toggle
}

export default function PostDayDebtWizard() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { createCharge, createPayment } = useDebts();

  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Step 2: customer selection (multi-select)
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = selectedIds.length === customers.length;

  // Step 3: entries per selected customer
  const [entries, setEntries] = useState<Record<string, LineEntry>>({});

  const selectedCustomers = useMemo(() => customers.filter(c => selectedIds.includes(c.id)), [customers, selectedIds]);

  const ensureEntry = (id: string) => {
    setEntries((old) => ({
      ...old,
      [id]: old[id] || { containers: '', payment: '', notes: '', finalMode: false },
    }));
  };

  const setEntry = (id: string, patch: Partial<LineEntry>) => {
    setEntries((old) => ({
      ...old,
      [id]: { ...(old[id] || { containers: '', payment: '', notes: '', finalMode: false }), ...patch },
    }));
  };

  const next = () => setStep((s) => (Math.min(4, (s + 1) as number) as Step));
  const prev = () => setStep((s) => (Math.max(1, (s - 1) as number) as Step));

  const validateStep2 = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one customer');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (const id of selectedIds) {
      const e = entries[id];
      if (!e) return false;
      const containers = Number(e.containers || '0');
      const payment = Number(e.payment || '0');
      if (containers <= 0 && payment <= 0) {
        toast.error('Each selected customer must have containers or payment');
        return false;
      }
      if (containers < 0 || payment < 0) {
        toast.error('Values cannot be negative');
        return false;
      }
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
      // init entries
      selectedIds.forEach(ensureEntry);
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

  const reviewRows = useMemo(() => {
    return selectedCustomers.map((c) => {
      const e = entries[c.id];
      const containers = Number(e?.containers || '0');
      const payment = Number(e?.payment || '0');
      return {
        id: c.id,
        name: c.name,
        containers,
        payment,
        notes: e?.notes || '',
        finalMode: e?.finalMode || false,
      };
    });
  }, [selectedCustomers, entries]);

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!date) { toast.error('Pick a date'); return; }
    setSubmitting(true);
    try {
      const isoDate = toISO(date)!;
      for (const row of reviewRows) {
        // Expand final state into discrete transactions
        if (row.containers > 0) {
          await createCharge({ customerId: row.id, containers: row.containers, transactionDate: isoDate, notes: row.notes || undefined });
        }
        if (row.payment > 0) {
          await createPayment({ customerId: row.id, amount: row.payment, transactionDate: isoDate, notes: row.notes || undefined });
        }
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
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Post Day (Debts)</h1>
      </div>

      {/* Step Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={step===1?'default':'outline'}><CalendarDays className="h-3 w-3 mr-1" /> Date</Badge>
        <Badge variant={step===2?'default':'outline'}><Users className="h-3 w-3 mr-1" /> Customers</Badge>
        <Badge variant={step===3?'default':'outline'}><ClipboardList className="h-3 w-3 mr-1" /> Entries</Badge>
        <Badge variant={step===4?'default':'outline'}><UploadCloud className="h-3 w-3 mr-1" /> Review</Badge>
      </div>

      {/* Step 1: Date */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Select Date</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DatePicker value={date} onChange={setDate} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Customers */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Select Customers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:min-w-[260px] justify-between" role="combobox">
                  {selectedIds.length === 0 ? 'Choose customers...' : `${selectedIds.length} selected`}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customer" />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup className="max-h-72 overflow-auto">
                    <CommandItem value="__all__" onSelect={() => {
                      if (allSelected) setSelectedIds([]); else setSelectedIds(customers.map(c=>c.id));
                    }}>
                      <Check className={cn('mr-2 h-4 w-4', allSelected ? 'opacity-100' : 'opacity-0')} />
                      All customers
                    </CommandItem>
                    {customers.map(c => {
                      const active = selectedIds.includes(c.id);
                      return (
                        <CommandItem key={c.id} value={c.name} onSelect={() => {
                          setSelectedIds((list) => active ? list.filter(id=>id!==c.id) : [...list, c.id]);
                        }}>
                          <Check className={cn('mr-2 h-4 w-4', active ? 'opacity-100' : 'opacity-0')} />
                          {c.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Entries */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Enter Containers / Payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedCustomers.length === 0 && (<div className="text-sm text-muted-foreground">No customers selected.</div>)}
            <div className="space-y-3">
              {selectedCustomers.map(c => {
                const e = entries[c.id] || { containers:'', payment:'', notes:'', finalMode:false };
                return (
                  <div key={c.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span>Final State</span>
                        <Button variant={e.finalMode?'default':'outline'} size="sm" onClick={()=> setEntry(c.id, { finalMode: !e.finalMode })}>
                          {e.finalMode ? 'On' : 'Off'}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Containers</Label>
                        <NumberInput value={e.containers} onChange={(v)=> setEntry(c.id, { containers: v })} min={0} step={1} />
                      </div>
                      <div>
                        <Label>Payment (PHP)</Label>
                        <NumberInput value={e.payment} onChange={(v)=> setEntry(c.id, { payment: v })} min={0} step={1} />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Textarea rows={2} value={e.notes} onChange={(ev)=> setEntry(c.id, { notes: ev.target.value })} />
                      </div>
                    </div>
                    {e.finalMode && (
                      <p className="mt-2 text-xs text-muted-foreground">Final State mode: values will be expanded into discrete charge/payment transactions on submit.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Review</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">Date: <b>{date?.toLocaleDateString()}</b></div>
            <div className="rounded-lg border overflow-x-auto">
              <div className="grid grid-cols-12 gap-2 p-2 text-xs text-muted-foreground min-w-[560px]">
                <div className="col-span-4">Customer</div>
                <div className="col-span-2 text-right">Containers</div>
                <div className="col-span-2 text-right">Payment</div>
                <div className="col-span-4">Notes</div>
              </div>
              <Separator />
              <div className="divide-y min-w-[560px]">
                {reviewRows.map((r)=> (
                  <div key={r.id} className="grid grid-cols-12 gap-2 p-2 text-sm">
                    <div className="col-span-4 truncate">{r.name}</div>
                    <div className="col-span-2 text-right">{r.containers}</div>
                    <div className="col-span-2 text-right">{r.payment}</div>
                    <div className="col-span-4 truncate">{r.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={step===1}>Back</Button>
        {step < 4 ? (
          <Button onClick={onNext}>Next</Button>
        ) : (
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit All'}</Button>
        )}
      </div>
    </div>
  );
}
