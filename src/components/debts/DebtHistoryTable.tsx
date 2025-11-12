import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { DateRangePicker } from '@/components/date/DateRangePicker';
import { Separator } from '@/components/ui/separator';
import { ChevronsUpDown, Download, FileText } from 'lucide-react';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useDebtTransactionsQuery } from '@/lib/queries/debtsQueries';
import type { DebtHistoryFilters } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DebtHistoryTableProps {
  initialFilters?: DebtHistoryFilters;
}

export function DebtHistoryTable({ initialFilters }: DebtHistoryTableProps) {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>(initialFilters?.customerId);
  const [type, setType] = useState<DebtHistoryFilters['transactionType']>(initialFilters?.transactionType);
  const [status, setStatus] = useState<DebtHistoryFilters['status']>(initialFilters?.status);
  const [page, setPage] = useState(initialFilters?.page ?? 1);
  const [limit] = useState(initialFilters?.limit ?? 50);
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

  const { data } = useDebtTransactionsQuery(filters);
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const exportCSV = () => {
    const meta = [
      `Generated At:,${new Date().toISOString()}`,
      `Filters:,Customer=${customerId||'ALL'}; Type=${type||'ALL'}; Status=${status||'ALL'}; Start=${filters.startDate||''}; End=${filters.endDate||''}`
    ].join('\n');
    const header = ['Date/Time','Customer Tab','Action','Containers','Amount','Balance After','Note','Entered By'];
    const body = rows.map(r => [
      new Date(r.transactionDate).toLocaleString(),
      r.debtTabId,
      r.transactionType,
      r.containers ?? '',
      r.amount ?? '',
      r.balanceAfter,
      r.notes ?? '',
      r.enteredById ?? '',
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
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
    const rowsHtml = rows.map(r => `<tr>
      <td class="nowrap">${new Date(r.transactionDate).toLocaleString()}</td>
      <td>${r.debtTabId}</td>
      <td>${r.transactionType}</td>
      <td class="nowrap" style="text-align:right">${r.containers ?? ''}</td>
      <td class="nowrap" style="text-align:right">${r.amount ?? ''}</td>
      <td class="nowrap" style="text-align:right">${r.balanceAfter}</td>
      <td>${(r.notes||'').replace(/</g,'&lt;')}</td>
      <td>${r.enteredById ?? ''}</td>
    </tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Debt History Export</title>${style}</head><body>
      <h1>Debt History Export</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()}<br>${meta}</div>
      <table><thead><tr>
        <th>Date/Time</th><th>Customer Tab</th><th>Action</th><th>Containers</th><th>Amount</th><th>Balance After</th><th>Note</th><th>Entered By</th>
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
        <div className="flex gap-1">
          {(['ALL','CHARGE','PAYMENT','ADJUSTMENT'] as const).map(v => (
            <Badge key={v} variant={type=== (v==='ALL'? undefined : v) ? 'default' : 'outline'} className="cursor-pointer" onClick={()=>{ setType(v==='ALL'? undefined : v); setPage(1); }}>{v}</Badge>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(['ALL','OPEN','CLOSED'] as const).map(v => (
            <Badge key={v} variant={status=== (v==='ALL'? undefined : v) ? 'default' : 'outline'} className="cursor-pointer" onClick={()=>{ setStatus(v==='ALL'? undefined : v); setPage(1); }}>{v}</Badge>
          ))}
        </div>

        <div className="ml-auto w-full sm:w-auto flex justify-end gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button variant="outline" onClick={exportPDF}><FileText className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </div>

      <Separator />

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
            {rows.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={()=>navigate(`/debts/customer/${r.debtTabId}`)}>
                <TableCell>{new Date(r.transactionDate).toLocaleString()}</TableCell>
                <TableCell>{r.debtTabId}</TableCell>
                <TableCell>{r.transactionType}</TableCell>
                <TableCell className="text-right">{r.containers ?? ''}</TableCell>
                <TableCell className="text-right">{r.amount ? formatCurrency(r.amount) : ''}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.balanceAfter)}</TableCell>
                <TableCell className="truncate max-w-[240px]">{r.notes}</TableCell>
                <TableCell>{r.enteredById ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <button key={r.id} onClick={()=>navigate(`/debts/customer/${r.debtTabId}`)} className="w-full text-left">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{r.transactionType}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.transactionDate).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-sm">Customer: {r.debtTabId}</div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                <div>Containers: {r.containers ?? '-'}</div>
                <div className="text-right">Amount: {r.amount ? formatCurrency(r.amount) : '-'}</div>
                <div className="col-span-2 flex items-center justify-between">
                  <span>Balance After</span>
                  <span className="font-medium">{formatCurrency(r.balanceAfter)}</span>
                </div>
              </div>
              {r.notes && <div className="mt-1 text-xs text-muted-foreground">Note: {r.notes}</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={!pg?.hasPrev} onClick={()=> setPage(p=> Math.max(1, p-1))}>Prev</Button>
        <div className="text-sm text-muted-foreground">Page {pg?.page ?? page} / {pg?.totalPages ?? 1}</div>
        <Button variant="outline" disabled={!pg?.hasNext} onClick={()=> setPage(p=> p+1)}>Next</Button>
      </div>
    </div>
  );
}

export default DebtHistoryTable;
