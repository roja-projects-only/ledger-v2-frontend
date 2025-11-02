import { useMemo, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink, PaginationEllipsis } from '@/components/ui/pagination';
import { useCustomerDebts } from '@/lib/queries/debtsQueries';
import type { DebtStatus } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

function StatusPill({ status }: { status: DebtStatus }) {
  const tone = status === 'CLEARED' ? 'bg-green-500' : status === 'PARTIAL' ? 'bg-yellow-500' : 'bg-red-500';
  const label = status === 'CLEARED' ? 'Cleared' : status === 'PARTIAL' ? 'Partial' : 'Unpaid';
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className={cn('inline-block h-2.5 w-2.5 rounded-full', tone)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export function DebtsCustomers() {
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | DebtStatus>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const filters = useMemo(() => {
    const f: { search?: string; status?: DebtStatus; page: number; limit: number } = { page, limit };
    if (search.trim()) f.search = search.trim();
    if (status !== 'ALL') f.status = status;
    return f;
  }, [search, status, page, limit]);

  const { data, isLoading, isError } = useCustomerDebts(filters);
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  const totalPages = pg?.totalPages ?? 1;
  const currentPage = Math.min(page, totalPages || 1);

  const handleGoTo = (p: number) => setPage(Math.max(1, Math.min(totalPages || 1, p)));

  return (
    <Container className="py-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Debts</h1>
          <p className="text-muted-foreground mt-1">Search by name and filter by status.</p>
        </div>
      </div>

      {/* Action bar */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
            {/* Status filter */}
            <div className="w-full sm:w-56">
              <Select value={status} onValueChange={(v) => { setStatus(v as 'ALL' | DebtStatus); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <Card className="mt-4">
          <CardContent className="space-y-3 py-6">
            {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="mt-4">
          <CardContent className="py-6">
            <div className="text-sm text-muted-foreground">Failed to load debts.</div>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="py-12 text-center text-muted-foreground">No matching results.</CardContent>
        </Card>
      ) : (
        <Card className="mt-4 hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 min-w-[220px]">Customer</TableHead>
                    <TableHead className="text-right min-w-[140px]">Amount Owed</TableHead>
                    <TableHead className="min-w-[160px]">Last Payment</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.customerId}>
                      <TableCell className="pl-6 font-medium">{r.customerName}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(r.currentBalance)}</TableCell>
                      <TableCell>{r.lastPaymentAt ? formatDate(r.lastPaymentAt) : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile list */}
      {!isLoading && !isError && rows.length > 0 && (
        <div className="md:hidden space-y-3 mt-4">
          {rows.map((r) => (
            <Card key={r.customerId}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="font-semibold truncate">{r.customerName}</div>
                  <StatusPill status={r.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Owed</span>
                  <span className="font-medium">{formatCurrency(r.currentBalance)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last payment</span>
                  <span>{r.lastPaymentAt ? formatDate(r.lastPaymentAt) : '—'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (pg?.totalPages ?? 1) > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handleGoTo(currentPage - 1)} className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const show = p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1);
                const showEllipsisBefore = p === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = p === currentPage + 2 && currentPage < totalPages - 2;
                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <PaginationItem key={p}><PaginationEllipsis /></PaginationItem>
                  );
                }
                if (!show) return null;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink onClick={() => handleGoTo(p)} isActive={currentPage === p} className="cursor-pointer">{p}</PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext onClick={() => handleGoTo(currentPage + 1)} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
        </div>
      )}
    </Container>
  );
}

export default DebtsCustomers;
