/**
 * Outstanding Balances Page - View customers with outstanding debt
 *
 * Features:
 * - List of customers with outstanding balances
 * - Sort by amount owed, days overdue
 * - Filter by amount ranges and overdue status
 * - Show aging categories (0-30, 31-60, 60+ days)
 * - Total outstanding summary KPI
 */

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KPICard } from "@/components/shared/KPICard";
import { OutstandingBalanceCard } from "@/components/shared/OutstandingBalanceCard";
import { CustomerDebtHistoryModal } from "@/components/shared/CustomerDebtHistoryModal";
import { PaymentRecordingModal } from "@/components/shared/PaymentRecordingModal";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { usePagination } from "@/lib/hooks/usePagination";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import type { OutstandingBalance } from "@/lib/types";
import { getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Users,
  Search,
  TrendingUp,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type SortField = "amount" | "days" | "name" | "location";
type SortDirection = "asc" | "desc";
type AmountFilter =
  | "all"
  | "under-500"
  | "500-1000"
  | "1000-2000"
  | "over-2000";
type OverdueFilter = "all" | "current" | "overdue" | "collection";

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// Outstanding Balances Page Component
// ============================================================================

export function OutstandingBalances() {
  // Fetch outstanding balances
  const {
    data: outstandingBalances,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.outstanding(),
    queryFn: paymentsApi.getOutstandingBalances,
  });

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "amount",
    direction: "desc",
  });

  // Modal state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [selectedBalance, setSelectedBalance] =
    useState<OutstandingBalance | null>(null);
  const [debtHistoryModalOpen, setDebtHistoryModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!outstandingBalances) return null;

    const totalOutstanding = outstandingBalances.reduce(
      (sum, balance) => sum + balance.totalOwed,
      0
    );
    const totalCustomers = outstandingBalances.length;
    const averageDebt =
      totalCustomers > 0 ? totalOutstanding / totalCustomers : 0;

    // Aging breakdown
    const aging = outstandingBalances.reduce(
      (acc, balance) => {
        if (balance.daysPastDue <= 30) {
          acc.current.count += 1;
          acc.current.amount += balance.totalOwed;
        } else if (balance.daysPastDue <= 60) {
          acc.thirtyDays.count += 1;
          acc.thirtyDays.amount += balance.totalOwed;
        } else if (balance.daysPastDue <= 90) {
          acc.sixtyDays.count += 1;
          acc.sixtyDays.amount += balance.totalOwed;
        } else {
          acc.ninetyDaysPlus.count += 1;
          acc.ninetyDaysPlus.amount += balance.totalOwed;
        }
        return acc;
      },
      {
        current: { count: 0, amount: 0 },
        thirtyDays: { count: 0, amount: 0 },
        sixtyDays: { count: 0, amount: 0 },
        ninetyDaysPlus: { count: 0, amount: 0 },
      }
    );

    return {
      totalOutstanding,
      totalCustomers,
      averageDebt,
      aging,
    };
  }, [outstandingBalances]);

  // Filtered and sorted balances
  const filteredBalances = useMemo(() => {
    if (!outstandingBalances) return [];

    let filtered = outstandingBalances.filter((balance) => {
      // Search filter
      const matchesSearch = balance.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Amount filter
      let matchesAmount = true;
      switch (amountFilter) {
        case "under-500":
          matchesAmount = balance.totalOwed < 500;
          break;
        case "500-1000":
          matchesAmount = balance.totalOwed >= 500 && balance.totalOwed < 1000;
          break;
        case "1000-2000":
          matchesAmount = balance.totalOwed >= 1000 && balance.totalOwed < 2000;
          break;
        case "over-2000":
          matchesAmount = balance.totalOwed >= 2000;
          break;
      }

      // Overdue filter
      let matchesOverdue = true;
      switch (overdueFilter) {
        case "current":
          matchesOverdue = balance.daysPastDue <= 30;
          break;
        case "overdue":
          matchesOverdue = balance.daysPastDue > 30;
          break;
        case "collection":
          matchesOverdue = balance.collectionStatus === "SUSPENDED";
          break;
      }

      return matchesSearch && matchesAmount && matchesOverdue;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "amount":
          comparison = a.totalOwed - b.totalOwed;
          break;
        case "days":
          comparison = a.daysPastDue - b.daysPastDue;
          break;
        case "name":
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [
    outstandingBalances,
    searchQuery,
    amountFilter,
    overdueFilter,
    sortConfig,
  ]);

  // Pagination
  const pagination = usePagination(filteredBalances, {
    mobile: 5,
    tablet: 8,
    desktop: 15,
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRecordPayment = (customerId: string) => {
    const balance = outstandingBalances?.find(
      (b) => b.customerId === customerId
    );
    if (balance) {
      setSelectedCustomerId(customerId);
      setSelectedCustomerName(balance.customerName);
      setSelectedBalance(balance);
      setPaymentModalOpen(true);
    }
  };

  const handleViewHistory = (customerId: string) => {
    const balance = outstandingBalances?.find(
      (b) => b.customerId === customerId
    );
    if (balance) {
      setSelectedCustomerId(customerId);
      setSelectedCustomerName(balance.customerName);
      setSelectedBalance(balance);
      setDebtHistoryModalOpen(true);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Outstanding Balances
            </h1>
            <p className="text-muted-foreground mt-1">
              Track customers with unpaid credit sales
            </p>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              label="Total Outstanding"
              value={summaryStats ? formatCurrency(summaryStats.totalOutstanding) : "₱0.00"}
              icon={DollarSign}
              variant="revenue"
              loading={isLoading}
            />
            <KPICard
              label="Customers with Debt"
              value={summaryStats?.totalCustomers ?? 0}
              icon={Users}
              variant="customers"
              loading={isLoading}
            />
            <KPICard
              label="Average Debt"
              value={summaryStats ? formatCurrency(summaryStats.averageDebt) : "₱0.00"}
              icon={TrendingUp}
              variant="average"
              loading={isLoading}
            />
            <KPICard
              label="90+ Days Overdue"
              value={summaryStats?.aging.ninetyDaysPlus.count ?? 0}
              icon={AlertTriangle}
              variant="quantity"
              loading={isLoading}
            />
          </div>

          {/* Aging Summary */}
          {summaryStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aging Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(summaryStats.aging.current.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      0-30 days ({summaryStats.aging.current.count} customers)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(summaryStats.aging.thirtyDays.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      31-60 days ({summaryStats.aging.thirtyDays.count}{" "}
                      customers)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(summaryStats.aging.sixtyDays.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      61-90 days ({summaryStats.aging.sixtyDays.count}{" "}
                      customers)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(summaryStats.aging.ninetyDaysPlus.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      90+ days ({summaryStats.aging.ninetyDaysPlus.count}{" "}
                      customers)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search Customers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Amount Filter */}
                <div className="space-y-2">
                  <Label htmlFor="amount-filter">Amount Range</Label>
                  <Select
                    value={amountFilter}
                    onValueChange={(value) =>
                      setAmountFilter(value as AmountFilter)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="amount-filter" className="w-full sm:w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Amounts</SelectItem>
                      <SelectItem value="under-500">Under ₱500</SelectItem>
                      <SelectItem value="500-1000">₱500 - ₱1,000</SelectItem>
                      <SelectItem value="1000-2000">₱1,000 - ₱2,000</SelectItem>
                      <SelectItem value="over-2000">Over ₱2,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Overdue Filter */}
                <div className="space-y-2">
                  <Label htmlFor="overdue-filter">Status</Label>
                  <Select
                    value={overdueFilter}
                    onValueChange={(value) =>
                      setOverdueFilter(value as OverdueFilter)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger id="overdue-filter" className="w-full sm:w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="current">
                        Current (0-30 days)
                      </SelectItem>
                      <SelectItem value="overdue">
                        Overdue (30+ days)
                      </SelectItem>
                      <SelectItem value="collection">In Collection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort By</Label>
                  <Select
                    value={`${sortConfig.field}-${sortConfig.direction}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split("-") as [
                        SortField,
                        SortDirection
                      ];
                      setSortConfig({ field, direction });
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="sort" className="w-full sm:w-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount-desc">
                        Amount (High to Low)
                      </SelectItem>
                      <SelectItem value="amount-asc">
                        Amount (Low to High)
                      </SelectItem>
                      <SelectItem value="days-desc">
                        Days Overdue (Most to Least)
                      </SelectItem>
                      <SelectItem value="days-asc">
                        Days Overdue (Least to Most)
                      </SelectItem>
                      <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                      <SelectItem value="location-asc">
                        Location (A to Z)
                      </SelectItem>
                      <SelectItem value="location-desc">
                        Location (Z to A)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                errorTone.bg,
                errorTone.border,
                errorTone.text
              )}
            >
              <p className="font-medium">
                Unable to load outstanding balances.
              </p>
              <p className={cn("text-xs", errorTone.subtext)}>
                {error instanceof Error ? error.message : "Unknown error"}.
                Please check your connection and try again.
              </p>
            </div>
          )}

          {/* Outstanding Balances List */}
          {isLoading ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : !outstandingBalances || outstandingBalances.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">
                    No outstanding balances
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All customers have paid their credit sales
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredBalances.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No customers found matching your filters
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Paginated List */}
              <div className="space-y-3">
                {pagination.pageItems.map((balance) => (
                  <OutstandingBalanceCard
                    key={balance.customerId}
                    balance={balance}
                    onRecordPayment={handleRecordPayment}
                    onViewHistory={handleViewHistory}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <Card>
                  <CardContent className="py-4">
                    <PaginationControls
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPrevious={pagination.prevPage}
                      onNext={pagination.nextPage}
                      onGoToPage={pagination.goToPage}
                      totalItems={pagination.totalItems}
                      itemsPerPage={pagination.itemsPerPage}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Customer Debt History Modal */}
      <CustomerDebtHistoryModal
        open={debtHistoryModalOpen}
        onOpenChange={setDebtHistoryModalOpen}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
        outstandingBalance={selectedBalance || undefined}
        onRecordPayment={handleRecordPayment}
      />

      {/* Payment Recording Modal */}
      <PaymentRecordingModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
        outstandingBalance={selectedBalance || undefined}
        onPaymentRecorded={() => {
          // Refresh the outstanding balances data
          // The query will automatically refetch due to invalidation in the modal
        }}
      />
    </div>
  );
}
