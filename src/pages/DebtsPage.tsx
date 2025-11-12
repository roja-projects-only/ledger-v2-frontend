import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, CreditCard, Users } from 'lucide-react';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useDebts } from '@/lib/hooks/useDebts';
import DebtCustomerCard from '@/components/debts/DebtCustomerCard';
import DebtHistoryTable from '@/components/debts/DebtHistoryTable';
import { DebtPaymentForm } from '@/components/debts/DebtPaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { DebtSummaryItem } from '@/lib/types';

export default function DebtsPage() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { summary } = useDebts();

  const [tab, setTab] = useState<'list'|'history'>('list');
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payCustomerId, setPayCustomerId] = useState<string | null>(null);

  const summaryMap = useMemo(() => new Map(summary.map(s => [s.customerId, s])), [summary]);

  const merged: Array<{ item: DebtSummaryItem; location?: string }> = useMemo(() => {
    // Build a list for all customers, merging any balances from summary (open tabs)
    return customers.map((c) => ({
      item: {
        customerId: c.id,
        customerName: c.name,
        balance: summaryMap.get(c.id)?.balance ?? 0,
        status: (summaryMap.get(c.id)?.status ?? 'CLOSED') as DebtSummaryItem['status'],
        openedAt: summaryMap.get(c.id)?.openedAt ?? new Date(0).toISOString(),
        lastUpdated: summaryMap.get(c.id)?.lastUpdated ?? new Date(0).toISOString(),
      },
      location: c.location,
    }));
  }, [customers, summaryMap]);

  // Pagination for customer list (mobile-aware)
  const [, setIsMobile] = useState(false); // state only to trigger limit changes
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const m = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsMobile(m);
      setLimit(m ? 6 : 12);
      setPage(1);
    };
    onChange(mql as any);
    mql.addEventListener?.('change', onChange as any);
    ;(mql as any).addListener?.(onChange);
    return () => {
      mql.removeEventListener?.('change', onChange as any);
      ;(mql as any).removeListener?.(onChange);
    };
  }, []);
  const totalPages = Math.max(1, Math.ceil(merged.length / limit));
  const paged = useMemo(() => merged.slice((page-1)*limit, (page-1)*limit + limit), [merged, page, limit]);

  const onSelectCustomer = (id: string) => {
    setOpen(false);
    navigate(`/debts/customer/${id}`);
  };

  const onRecordPayment = (id: string) => {
    setOpen(false);
    setPayCustomerId(id);
    setPayOpen(true);
  };

  const currentBalance = payCustomerId ? (summaryMap.get(payCustomerId)?.balance ?? 0) : 0;

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={tab==='list'?'default':'outline'} onClick={()=>setTab('list')}><Users className="h-4 w-4 mr-1" /> Customer List</Button>
        <Button variant={tab==='history'?'default':'outline'} onClick={()=>setTab('history')}>History Log</Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-auto min-w-[260px] justify-between" role="combobox">
              Search customers...
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" align="end">
            <Command>
              <CommandInput placeholder="Type a customer name" />
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup className="max-h-72 overflow-auto">
                {merged.map(({ item }) => (
                  <CommandItem key={item.customerId} value={`${item.customerName}`}>
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{item.customerName}</span>
                        <span className="text-xs text-muted-foreground">Balance: {item.balance.toLocaleString(undefined,{style:'currency',currency:'PHP'})}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={(e)=>{ e.preventDefault(); onSelectCustomer(item.customerId); }}>View</Button>
                        <Button size="sm" onClick={(e)=>{ e.preventDefault(); onRecordPayment(item.customerId); }} disabled={item.balance <= 0}>
                          <CreditCard className="h-3 w-3 mr-1" /> Pay
                        </Button>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {tab==='list' && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paged.map(({ item, location }) => (
            <DebtCustomerCard
              key={item.customerId}
              item={item}
              location={location as never}
              onViewDetails={onSelectCustomer}
              onRecordPayment={onRecordPayment}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1}>Prev</Button>
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
          <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</Button>
        </div>
        </>
      )}

      {tab==='history' && (
        <Card>
          <CardHeader>
            <CardTitle>History Log</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtHistoryTable />
          </CardContent>
        </Card>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {payCustomerId && (
            <DebtPaymentForm customerId={payCustomerId} currentBalance={currentBalance} onSuccess={()=> setPayOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
