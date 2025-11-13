import { useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { DateRangePicker } from '@/components/date/DateRangePicker';
import { Separator } from '@/components/ui/separator';
import { ChevronsUpDown, Download, FileText, Loader2 } from 'lucide-react';
import { useCustomerList } from '@/lib/hooks/useCustomers';
import { useDebtTransactionsQuery } from '@/lib/queries/debtsQueries';
import type { DebtHistoryFilters, DebtTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DebtHistoryTableProps {
  initialFilters?: DebtHistoryFilters;
}

type DebtHistoryRow = DebtTransaction & {
  debtTab?: {
    customerId?: string;
    customer?: {
      name?: string;
    };
  };
  customerName?: string;
  customerId?: string;
  enteredBy?: {
    username?: string;
  };
};

export function DebtHistoryTable({ initialFilters }: DebtHistoryTableProps) {
  const navigate = useNavigate();
  const { customers } = useCustomerList();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>(initialFilters?.customerId);
  const [type, setType] = useState<DebtHistoryFilters['transactionType']>(initialFilters?.transactionType);
  const [status, setStatus] = useState<DebtHistoryFilters['status']>(initialFilters?.status);
  const [page, setPage] = useState(initialFilters?.page ?? 1);
  const [limit, setLimit] = useState(initialFilters?.limit ?? 50);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const apply = (matches: boolean) => {
      setLimit(matches ? 10 : 25);
      setPage(1);
    };
    apply(mql.matches);

    const listener = (event: MediaQueryListEvent) => apply(event.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }

    mql.addListener(listener);
    return () => mql.removeListener(listener);
  }, []);
  const [start, setStart] = useState<Date | undefined>(initialFilters?.startDate ? new Date(initialFilters.startDate) : undefined);
  const [end, setEnd] = useState<Date | undefined>(initialFilters?.endDate ? new Date(initialFilters.endDate) : undefined);

  const filters = useMemo<DebtHistoryFilters>(() => ({
    customerId,
    transactionType: type,
    status,
    startDate: start?.toISOString().split('T')[0],
    endDate: end?.toISOString().split('T')[0],
    page,
    limit,
  }), [customerId, type, status, start, end, page, limit]);

  const { data, isLoading, isError, error, isFetching } = useDebtTransactionsQuery(filters);
  const rows = data?.data ?? [];
  const tableRows = rows as DebtHistoryRow[];
  const pg = data?.pagination;
  const fetchErrorMessage = isError ? (error instanceof Error ? error.message : String(error)) : null;
  const showEmptyState = !isLoading && rows.length === 0;
  const refreshing = isFetching && !isLoading;

  const exportCSV = () => {
    const meta = [
      `Generated At:,${new Date().toISOString()}`,
      `Filters:,Customer=${customerId||'ALL'}; Type=${type||'ALL'}; Status=${status||'ALL'}; Start=${filters.startDate||''}; End=${filters.endDate||''}`
    ].join('\n');
    const header = ['Date/Time','Customer','Action','Containers','Amount','Balance After','Note','Entered By'];
    const body = tableRows.map((r) => {
      const cname = r.debtTab?.customer?.name || r.customerName || r.debtTabId;
      const enteredBy = r.enteredBy?.username ?? r.enteredById ?? '';
      return [
        new Date(r.transactionDate).toLocaleString(),
        cname,
        r.transactionType,
        r.containers ?? '',
        r.amount ?? '',
        r.balanceAfter,
        r.notes ?? '',
        enteredBy,
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
    }).join('\n');
    const csv = `${meta}\n\n${header.join(',')}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debt-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    // Without external libs, open a print-friendly window and let user "Save as PDF".
    const w = window.open('', '_blank');
    if (!w) return;
    const style = `
      <style>
        body { font-family: system-ui, Arial, sans-serif; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        .meta { font-size: 12px; margin-bottom: 16px; color:#555; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #444; padding: 4px 6px; vertical-align: top; }
        th { background: #f2f2f2; }
        .nowrap { white-space: nowrap; }
      </style>`;
    const meta = `Customer: ${customerId||'ALL'} | Type: ${type||'ALL'} | Status: ${status||'ALL'} | Start: ${filters.startDate||''} | End: ${filters.endDate||''}`;
    const rowsHtml = tableRows.map((r) => {
      const cname = r.debtTab?.customer?.name || r.customerName || r.debtTabId;
      const enteredBy = r.enteredBy?.username ?? r.enteredById ?? '';
      return `<tr>
      <td class="nowrap">${new Date(r.transactionDate).toLocaleString()}</td>
      <td>${cname}</td>
      <td>${r.transactionType}</td>
      <td class="nowrap" style="text-align:right">${r.containers ?? ''}</td>
      <td class="nowrap" style="text-align:right">${r.amount ?? ''}</td>
      <td class="nowrap" style="text-align:right">${r.balanceAfter}</td>
      <td>${(r.notes||'').replace(/</g,'&lt;')}</td>
      <td>${enteredBy}</td>
    </tr>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Debt History Export</title>${style}</head><body>
      <h1>Debt History Export</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()}<br>${meta}</div>
      <table><thead><tr>
        <th>Date/Time</th><th>Customer</th><th>Action</th><th>Containers</th><th>Amount</th><th>Balance After</th><th>Note</th><th>Entered By</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.print();</script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Customer filter */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full sm:min-w-[220px] justify-between">
              {customerId ? (customers.find(c=>c.id===customerId)?.name ?? 'Unknown') : 'All customers'}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search customer" />
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                <CommandItem value="__all__" onSelect={() => { setCustomerId(undefined); setOpen(false); setPage(1); }}>All customers</CommandItem>
                {customers.map(c => (
                  <CommandItem key={c.id} value={c.name} onSelect={() => { setCustomerId(c.id); setOpen(false); setPage(1); }}>
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Date range */}
        <DateRangePicker startDate={start} endDate={end} onStartDateChange={(d)=>{ setStart(d); setPage(1); }} onEndDateChange={(d)=>{ setEnd(d); setPage(1); }} />

        {/* Type filter */}
        <div className="flex flex-wrap gap-1" role="group" aria-label="Transaction type filter">
          {(['ALL','CHARGE','PAYMENT','ADJUSTMENT'] as const).map((v) => {
            const nextType = v === 'ALL' ? undefined : v;
            const isActive = type === nextType;
            const label = v === 'ALL' ? 'All Types' : v.charAt(0) + v.slice(1).toLowerCase();
            return (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                aria-pressed={isActive}
                className="min-w-[88px]"
                onClick={() => {
                  setType(nextType);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1" role="group" aria-label="Tab status filter">
          {(['ALL','OPEN','CLOSED'] as const).map((v) => {
            const nextStatus = v === 'ALL' ? undefined : v;
            const isActive = status === nextStatus;
            const label = v === 'ALL' ? 'All Statuses' : v.charAt(0) + v.slice(1).toLowerCase();
            return (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={isActive ? 'default' : 'outline'}
                aria-pressed={isActive}
                className="min-w-[96px]"
                onClick={() => {
                  setStatus(nextStatus);
                  setPage(1);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="ml-auto w-full sm:w-auto flex justify-end gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={isLoading || rows.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={isLoading || rows.length === 0}>
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <Separator />
      {fetchErrorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{fetchErrorMessage}</AlertDescription>
        </Alert>
      )}

      {refreshing && !fetchErrorMessage && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Refreshing results…
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading history…
        </div>
      ) : showEmptyState ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No transactions match the current filters.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Containers</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Entered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((r) => {
                  const cid = r.debtTab?.customerId || r.customerId || r.debtTabId;
                  const cname = r.debtTab?.customer?.name || r.customerName || r.debtTabId;
                  const enteredBy = r.enteredBy?.username ?? r.enteredById ?? '';
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={()=>navigate(`/debts/customer/${cid}?highlight=${r.id}&tabId=${r.debtTabId}`)}>
                      <TableCell>{new Date(r.transactionDate).toLocaleString()}</TableCell>
                      <TableCell>{cname}</TableCell>
                      <TableCell>{r.transactionType}</TableCell>
                      <TableCell className="text-right">{r.containers ?? ''}</TableCell>
                      <TableCell className="text-right">{r.amount ? formatCurrency(r.amount) : ''}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.balanceAfter)}</TableCell>
                      <TableCell className="truncate max-w-[240px]">{r.notes}</TableCell>
                      <TableCell>{enteredBy}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {tableRows.map((r) => {
              const cid = r.debtTab?.customerId || r.customerId || r.debtTabId;
              const cname = r.debtTab?.customer?.name || r.customerName || r.debtTabId;
              const enteredBy = r.enteredBy?.username ?? r.enteredById ?? '';
              return (
                <button key={r.id} onClick={()=>navigate(`/debts/customer/${cid}?highlight=${r.id}&tabId=${r.debtTabId}`)} className="w-full text-left">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{r.transactionType}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.transactionDate).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 text-sm">Customer: {cname}</div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                      <div>Containers: {r.containers ?? '-'}</div>
                      <div className="text-right">Amount: {r.amount ? formatCurrency(r.amount) : '-'}</div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span>Balance After</span>
                        <span className="font-medium">{formatCurrency(r.balanceAfter)}</span>
                      </div>
                    </div>
                    {r.notes && <div className="mt-1 text-xs text-muted-foreground">Note: {r.notes}</div>}
                    <div className="mt-1 text-xs text-muted-foreground">Entered by: {enteredBy}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={!pg?.hasPrev} onClick={()=> setPage(p=> Math.max(1, p-1))}>Prev</Button>
          <div className="text-sm text-muted-foreground">Page {pg?.page ?? page} / {pg?.totalPages ?? 1}</div>
          <Button variant="outline" disabled={!pg?.hasNext} onClick={()=> setPage(p=> p+1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

export default DebtHistoryTable;
