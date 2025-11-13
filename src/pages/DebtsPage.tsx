import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronsUpDown, CreditCard, Loader2, Users } from 'lucide-react';
import { useCustomerList } from '@/lib/hooks/useCustomers';
import { useDebts } from '@/lib/hooks/useDebts';
import DebtCustomerCard from '@/components/debts/DebtCustomerCard';
import DebtHistoryTable from '@/components/debts/DebtHistoryTable';
import { DebtPaymentForm } from '@/components/debts/DebtPaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { DebtSummaryItem, Location } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useCustomerDebtQuery } from '@/lib/queries/debtsQueries';

export default function DebtsPage() {
  const navigate = useNavigate();
  const { customers, loading: customersLoading, error: customersError } = useCustomerList();
  const { summary, summaryStatus, loading: debtsLoading, error: debtsError } = useDebts();

  const [tab, setTab] = useState<'list'|'history'>('list');
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payCustomerId, setPayCustomerId] = useState<string | null>(null);

  const summaryMap = useMemo(() => new Map(summary.map(s => [s.customerId, s])), [summary]);

  const merged: Array<{ item: DebtSummaryItem; location: Location }> = useMemo(() => {
    return customers.map((c) => {
      const match = summaryMap.get(c.id);
      return {
        item: match ?? {
          customerId: c.id,
          customerName: c.name,
          balance: 0,
          status: 'CLOSED' as DebtSummaryItem['status'],
          openedAt: '',
          lastUpdated: '',
        },
        location: c.location,
      };
    });
  }, [customers, summaryMap]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const applyMatch = (matches: boolean) => {
      setLimit(matches ? 6 : 12);
      setPage(1);
    };
    applyMatch(mql.matches);

    const listener = (event: MediaQueryListEvent) => applyMatch(event.matches);

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }

    mql.addListener(listener);
    return () => mql.removeListener(listener);
  }, []);
  const totalPages = Math.max(1, Math.ceil(merged.length / limit));
  const paged = useMemo(() => merged.slice((page-1)*limit, (page-1)*limit + limit), [merged, page, limit]);

  const fetchErrorMessage = customersError ?? (debtsError instanceof Error ? debtsError.message : debtsError ? String(debtsError) : null);
  const showInitialLoading = customersLoading || debtsLoading;
  const refreshInFlight = summaryStatus.isFetching && !summaryStatus.isLoading;
  const showEmptyState = !showInitialLoading && merged.length === 0;

  const payCustomerQuery = useCustomerDebtQuery(payCustomerId ?? '', payOpen && !!payCustomerId);
  const payCurrentBalance = payCustomerId
    ? payCustomerQuery.data?.tab?.totalBalance ?? summaryMap.get(payCustomerId)?.balance ?? 0
    : 0;

  const onSelectCustomer = (id: string) => {
    setOpen(false);
    navigate(`/debts/customer/${id}`);
  };

  const onRecordPayment = (id: string) => {
    setOpen(false);
    setPayCustomerId(id);
    setPayOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      {fetchErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{fetchErrorMessage}</AlertDescription>
        </Alert>
      )}

      {showInitialLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading debt data...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="w-full xs:w-auto" variant={tab==='list'?'default':'outline'} onClick={()=>setTab('list')}><Users className="h-4 w-4 mr-1" /> Customer List</Button>
            <Button className="w-full xs:w-auto" variant={tab==='history'?'default':'outline'} onClick={()=>setTab('history')}>History Log</Button>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:ml-auto sm:min-w-[260px] justify-between" role="combobox">
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
                            <span className="text-xs text-muted-foreground">Balance: {formatCurrency(item.balance)}</span>
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

          {refreshInFlight && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Refreshing balances…
            </div>
          )}

          <Separator />

          {tab==='list' && (
            <>
              {showEmptyState ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No customers found. Add customers to begin tracking debts.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paged.map(({ item, location }) => (
                    <DebtCustomerCard
                      key={item.customerId}
                      item={item}
                      location={location}
                      onViewDetails={onSelectCustomer}
                      onRecordPayment={onRecordPayment}
                    />
                  ))}
                </div>
              )}

              {!showEmptyState && (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1}>Prev</Button>
                  <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</Button>
                </div>
              )}
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
                payCustomerQuery.isLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching latest balance...
                  </div>
                ) : payCustomerQuery.isError ? (
                  <div className="space-y-3 py-2">
                    <Alert variant="destructive">
                      <AlertDescription>Unable to load the latest balance. Please try again.</AlertDescription>
                    </Alert>
                    <Button size="sm" variant="outline" onClick={()=> payCustomerQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <DebtPaymentForm
                    customerId={payCustomerId}
                    currentBalance={payCurrentBalance}
                    onSuccess={()=> setPayOpen(false)}
                  />
                )
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
