import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationBadge } from '@/components/shared/LocationBadge';
import DebtTimeline from '@/components/debts/DebtTimeline';
import { DebtChargeForm } from '@/components/debts/DebtChargeForm';
import { DebtPaymentForm } from '@/components/debts/DebtPaymentForm';
import { DebtAdjustmentForm } from '@/components/debts/DebtAdjustmentForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDebts } from '@/lib/hooks/useDebts';
import { formatCurrency, cn } from '@/lib/utils';
import type { Customer, DebtTab, DebtTransaction } from '@/lib/types';
import { ArrowLeft, CircleDollarSign, Plus, CheckCircle2, Wrench, CircleSlash, Loader2 } from 'lucide-react';
import { useTodaySalesQuery } from '@/lib/queries/salesQueries';

export default function CustomerDebtPage() {
  const { customerId = '' } = useParams<{ customerId: string }>();
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const highlightId = search.get('highlight');
  const highlightTabId = search.get('tabId');
  const { customerDebt, customerHistory, markPaid, useTransactions, loading, error } = useDebts(customerId);
  const fetchErrorMessage = error instanceof Error ? error.message : error ? String(error) : null;
  const isInitialLoading = loading && !customerDebt;

  const [activeTab, setActiveTab] = useState<'open'|'history'|'notes'>('open');
  const [showCharge, setShowCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const { data: todaySales = [], isLoading: todaySalesLoading } = useTodaySalesQuery({ enabled: !!customerId });

  // Customer snapshot provided by API adapter
  const customer: Customer | null = customerDebt?.customer ?? null;
  const openTab: DebtTab | null = customerDebt?.tab ?? null;
  // Paginated open-tab transactions (mobile-aware page size)
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const limit = isMobile ? 10 : 20;
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const update = (matches: boolean) => setIsMobile(matches);
    update(mql.matches);

    const listener = (event: MediaQueryListEvent) => update(event.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }

    mql.addListener(listener);
    return () => mql.removeListener(listener);
  }, []);

  const openTrxQ = useTransactions({ customerId: customerId, status: 'OPEN', page, limit });
  const openTransactions = useMemo(() => openTrxQ.data?.data ?? [], [openTrxQ.data]);
  const totalPages = openTrxQ.data?.pagination.totalPages || 1;

  // Compute unit price hint from customer
  const unitPrice = customer?.customUnitPrice;

  const todaySalesCount = useMemo(() => {
    if (!customerId || todaySalesLoading) return null;
    return todaySales.filter(s => s.customerId === customerId).length;
  }, [customerId, todaySales, todaySalesLoading]);

  // Past tabs and map of transactions grouped by tab
  const closedTabs = useMemo(() => customerHistory.tabs.filter(t => t.status === 'CLOSED'), [customerHistory]);
  const transactionsByTab = useMemo(() => {
    const map = new Map<string, DebtTransaction[]>();
    const all = customerHistory.transactions;
    for (const t of all) {
      if (!map.has(t.debtTabId)) map.set(t.debtTabId, []);
      map.get(t.debtTabId)!.push(t);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a,b)=> new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
      map.set(k, arr);
    }
    return map;
  }, [customerHistory]);

  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);
  // Auto-expand closed tab containing highlight if not in open tab
  useEffect(() => {
    if (highlightId) {
      const inOpen = openTransactions.some(t => t.id === highlightId);
      if (!inOpen) {
        // find closed tab containing highlight
        for (const tab of closedTabs) {
          const list = transactionsByTab.get(tab.id) || [];
          if (list.some(t => t.id === highlightId)) {
            setActiveTab('history');
            setExpandedTabId(tab.id);
            break;
          }
        }
      }
    }
  }, [highlightId, openTransactions, closedTabs, transactionsByTab]);

  const markPaidNow = async () => {
    if (!customerId) return;
    const remaining = openTab?.totalBalance ?? 0;
    try {
      await markPaid({ customerId, finalPayment: remaining > 0 ? remaining : undefined, transactionDate: new Date().toISOString() });
      setConfirmClose(false);
    } catch {
      // Error toast handled by the mutation; keep the dialog open for retry.
    }
  };

  if (isInitialLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading customer debt...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        {fetchErrorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        )}
        <Alert variant="destructive">
          <AlertDescription>We could not find a debt record for this customer.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/debts">Back to Debts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      {fetchErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{fetchErrorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/debts"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
        <h1 className="text-xl font-semibold">Customer Debt</h1>
      </div>

      {/* Header card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold">{customer?.name || '—'}</span>
            {customer?.location && <LocationBadge location={customer.location} size="sm" />}
            {typeof unitPrice === 'number' && (
              <Badge variant="outline" className="ml-auto">Unit Price: {formatCurrency(unitPrice)}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Current Balance</div>
              <div className={cn('text-lg font-semibold', openTab && openTab.totalBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                {formatCurrency(openTab?.totalBalance || 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <Badge variant={openTab?.status === 'OPEN' ? 'outline' : 'default'}>{openTab?.status || 'CLOSED'}</Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Today Sales</div>
              <div className="text-lg font-semibold">{todaySalesCount ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Last Updated</div>
              <div className="text-lg font-semibold">{openTab?.updatedAt ? new Date(openTab.updatedAt).toLocaleString() : '—'}</div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button className="w-full sm:w-auto" onClick={()=>setShowCharge(true)}><Plus className="h-4 w-4 mr-1" /> New Charge</Button>
            {openTab && (openTab.totalBalance ?? 0) > 0 && (
              <Button className="w-full sm:w-auto" variant="outline" onClick={()=>setShowPayment(true)}>
              <CircleDollarSign className="h-4 w-4 mr-1" /> Partial Payment
              </Button>
            )}
            <Button className="w-full sm:w-auto" variant="outline" onClick={()=>setShowAdjustment(true)}>
              <Wrench className="h-4 w-4 mr-1" /> Adjustment
            </Button>
            <Button className="w-full sm:w-auto" variant="destructive" onClick={()=>setConfirmClose(true)} disabled={!openTab}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['open','history','notes'] as const).map(t => (
          <Button key={t} className="w-full xs:w-auto" variant={activeTab===t? 'default':'outline'} onClick={()=>setActiveTab(t)}>
            {t==='open'?'Open Tab': t==='history'?'Past Tabs':'Notes'}
          </Button>
        ))}
      </div>

      {activeTab === 'open' && (
        <Card>
          <CardHeader>
            <CardTitle>Open Tab Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {openTrxQ.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : openTransactions.length > 0 ? (
              <>
                <DebtTimeline transactions={openTransactions} selectedId={highlightId || undefined} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page>=totalPages}>Next</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><CircleSlash className="h-4 w-4" /> No transactions</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Past Tabs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {closedTabs.length === 0 && (
              <div className="text-sm text-muted-foreground">No past tabs</div>
            )}
            {closedTabs.map(tab => (
              <div key={tab.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">CLOSED</Badge>
                    <span className="text-xs text-muted-foreground">Closed: {tab.closedAt ? new Date(tab.closedAt).toLocaleString() : '—'}</span>
                  </div>
                  <div className="text-sm font-medium">Final Balance: {formatCurrency(tab.totalBalance)}</div>
                </div>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={()=> setExpandedTabId(expandedTabId === tab.id ? null : tab.id)}>
                    {expandedTabId === tab.id ? 'Hide' : 'Show'} Timeline
                  </Button>
                </div>
                {expandedTabId === tab.id && (
                  <div className="mt-3">
                    <DebtTimeline transactions={transactionsByTab.get(tab.id) || []} selectedId={highlightTabId === tab.id ? (highlightId || undefined) : (highlightId && transactionsByTab.get(tab.id)?.some(t=>t.id===highlightId) ? highlightId : undefined)} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Notes coming soon.</div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={showCharge} onOpenChange={setShowCharge}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Charge</DialogTitle></DialogHeader>
          <DebtChargeForm defaultCustomerId={customerId} onSuccess={()=> setShowCharge(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {openTab && (openTab.totalBalance ?? 0) > 0 ? (
            <DebtPaymentForm customerId={customerId} currentBalance={openTab?.totalBalance || 0} onSuccess={()=> setShowPayment(false)} />
          ) : (
            <div className="text-sm text-muted-foreground">No outstanding balance.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Adjustment</DialogTitle></DialogHeader>
          <DebtAdjustmentForm customerId={customerId} currentBalance={openTab?.totalBalance || 0} onSuccess={()=> setShowAdjustment(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Mark Tab as Paid"
        description={(() => {
          const remaining = openTab?.totalBalance ?? 0;
          return remaining > 0
            ? `This will record a final payment of ${formatCurrency(remaining)} and close the tab.`
            : 'This will close the tab.';
        })()}
        confirmText="Mark Paid"
        variant="destructive"
        onConfirm={markPaidNow}
      />
    </div>
  );
}
