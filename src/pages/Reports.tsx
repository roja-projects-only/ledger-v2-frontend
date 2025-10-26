/**
 * Reports Page - Payment reports and analytics
 *
 * Features:
 * - Daily collections insights with timeline, breakdowns, and export
 * - Aging report with status tracking, risk highlights, and CSV export
 */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import {
  calculateAverage,
  capitalize,
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLocation,
} from "@/lib/utils";
import { getSemanticColor, type SemanticTone } from "@/lib/colors";
import type {
  CollectionStatus,
  Location,
  Payment,
  PaymentStatus,
} from "@/lib/types";
import {
  AlertCircle,
  BarChart3,
  CalendarIcon,
  Clock,
  Download,
  DollarSign,
  MapPin,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface AgingReportCustomer {
  customerId: string;
  customerName: string;
  location: Location;
  current: number;
  days31to60: number;
  days61to90: number;
  over90Days: number;
  totalOwed: number;
  collectionStatus: CollectionStatus;
  lastPaymentDate?: string;
}

interface AgingReportData {
  summary: {
    totalCustomers: number;
    totalOutstanding: number;
    current: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
  };
  customers: AgingReportCustomer[];
  generatedAt: string;
}

interface DailyPaymentsReportData {
  summary: {
    date: string;
    totalPayments: number;
    totalAmount: number;
    paymentMethods: Record<string, number>;
  };
  payments: Payment[];
  generatedAt: string;
}

// ============================================================================
// Constants & Helpers
// ============================================================================

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  COLLECTION: "Collection",
};

const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  ACTIVE: "Active",
  OVERDUE: "Overdue",
  SUSPENDED: "Suspended",
};

const PENDING_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PARTIAL",
  "OVERDUE",
  "COLLECTION",
];

const MAX_TOP_CUSTOMERS = 6;

const csvValue = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  return new Date(value).getTime();
};

const getStatusTone = (status: PaymentStatus): SemanticTone => {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIAL":
      return "info";
    case "UNPAID":
      return "info";
    case "OVERDUE":
    case "COLLECTION":
      return "warning";
    default:
      return "info";
  }
};

const getCollectionTone = (status: CollectionStatus): SemanticTone => {
  switch (status) {
    case "ACTIVE":
      return "info";
    case "OVERDUE":
      return "warning";
    case "SUSPENDED":
      return "error";
    default:
      return "info";
  }
};

const toneClasses = (tone?: SemanticTone) => {
  if (!tone) return "";
  const theme = getSemanticColor(tone);
  return cn(theme.bg, theme.border, theme.text);
};

const paymentSorter = (a: Payment, b: Payment) =>
  toTimestamp(b.paidAt ?? b.updatedAt ?? b.createdAt) -
  toTimestamp(a.paidAt ?? a.updatedAt ?? a.createdAt);

// ============================================================================
// Reports Page Component
// ============================================================================

export function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateISO = selectedDate.toISOString().split("T")[0];
  const [agingDate, setAgingDate] = useState<Date>(new Date());
  const agingDateISO = agingDate.toISOString().split("T")[0];

  const {
    data: dailyReport,
    isLoading: dailyLoading,
    error: dailyError,
  } = useQuery<DailyPaymentsReportData>({
    queryKey: queryKeys.payments.dailyReport(selectedDateISO),
    queryFn: () => paymentsApi.getDailyPaymentsReport(selectedDateISO),
  });

  const {
    data: agingReport,
    isLoading: agingLoading,
    error: agingError,
  } = useQuery<AgingReportData>({
    queryKey: queryKeys.payments.agingReport(agingDateISO),
    queryFn: () => paymentsApi.getAgingReport(),
  });

  const customersOverSixtyDays = useMemo(() => {
    if (!agingReport) return 0;
    return agingReport.customers.filter(
      (customer) => customer.days61to90 > 0 || customer.over90Days > 0
    ).length;
  }, [agingReport]);

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Reports</h1>
            <p className="text-muted-foreground mt-1">
              Explore daily collections and long-term credit health with actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              label="Collections Today"
              value={dailyReport ? formatCurrency(dailyReport.summary.totalAmount) : "₱0.00"}
              icon={DollarSign}
              variant="revenue"
              loading={dailyLoading}
            />
            <KPICard
              label="Payments Recorded"
              value={dailyReport?.summary.totalPayments ?? 0}
              icon={Receipt}
              variant="quantity"
              loading={dailyLoading}
            />
            <KPICard
              label="Total Outstanding"
              value={agingReport ? formatCurrency(agingReport.summary.totalOutstanding) : "₱0.00"}
              icon={AlertCircle}
              semanticTone="warning"
              loading={agingLoading}
            />
            <KPICard
              label="Customers 60+ Days"
              value={customersOverSixtyDays}
              icon={Users}
              variant="customers"
              loading={agingLoading}
            />
          </div>

          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList>
              <TabsTrigger value="daily">
                <Receipt className="mr-2 h-4 w-4" />
                Daily Collections
              </TabsTrigger>
              <TabsTrigger value="aging">
                <Clock className="mr-2 h-4 w-4" />
                Aging Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <DailyReportSection
                report={dailyReport}
                isLoading={dailyLoading}
                error={dailyError}
                selectedDate={selectedDate}
                selectedDateISO={selectedDateISO}
                onSelectDate={setSelectedDate}
              />
            </TabsContent>

            <TabsContent value="aging">
              <AgingReportSection
                report={agingReport}
                isLoading={agingLoading}
                error={agingError}
                selectedDate={agingDate}
                selectedDateISO={agingDateISO}
                onSelectDate={setAgingDate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </div>
  );
}

// ============================================================================
// Daily Report Section
// ============================================================================

interface DailyReportSectionProps {
  report?: DailyPaymentsReportData;
  isLoading: boolean;
  error: unknown;
  selectedDate: Date;
  selectedDateISO: string;
  onSelectDate: (date: Date) => void;
}

function DailyReportSection({
  report,
  isLoading,
  error,
  selectedDate,
  selectedDateISO,
  onSelectDate,
}: DailyReportSectionProps) {
  const insights = useMemo(() => {
    if (!report) return null;

    const payments = [...report.payments].sort(paymentSorter);

    const statusMap = payments.reduce(
      (acc, payment) => {
        const status = payment.status;
        const entry = acc.get(status) ?? {
          status,
          count: 0,
          amount: 0,
        };

        entry.count += 1;
        entry.amount += payment.paidAmount ?? payment.amount ?? 0;
        acc.set(status, entry);
        return acc;
      },
      new Map<PaymentStatus, { status: PaymentStatus; count: number; amount: number }>()
    );

    const methodBreakdown = Object.entries(report.summary.paymentMethods ?? {})
      .map(([method, amount]) => ({
        method,
        amount,
        percentage:
          report.summary.totalAmount > 0
            ? (amount / report.summary.totalAmount) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const customerTotals = payments.reduce(
      (acc, payment) => {
        const key = payment.customerId ?? payment.id;
        const existing = acc.get(key) ?? {
          customerId: key,
          name: payment.customer?.name ?? "Unknown customer",
          location: (payment.customer?.location as Location) ?? "URBAN",
          total: 0,
          lastPaymentAt: payment.paidAt ?? payment.updatedAt ?? payment.createdAt,
        };

        existing.total += payment.paidAmount ?? payment.amount ?? 0;
        const candidate = payment.paidAt ?? payment.updatedAt ?? payment.createdAt;
        if (candidate && toTimestamp(candidate) > toTimestamp(existing.lastPaymentAt)) {
          existing.lastPaymentAt = candidate;
        }

        acc.set(key, existing);
        return acc;
      },
      new Map<
        string,
        {
          customerId: string;
          name: string;
          location: Location;
          total: number;
          lastPaymentAt?: string;
        }
      >()
    );

    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, MAX_TOP_CUSTOMERS);

    const pendingPayments = payments.filter((payment) =>
      PENDING_STATUSES.includes(payment.status)
    );

    const pendingAmount = pendingPayments.reduce(
      (sum, payment) => sum + Math.max((payment.amount ?? 0) - (payment.paidAmount ?? 0), 0),
      0
    );

    const firstPaymentAt = payments.at(-1)?.paidAt ?? payments.at(-1)?.createdAt;
    const lastPaymentAt = payments.at(0)?.paidAt ?? payments.at(0)?.createdAt;

    return {
      payments,
      statusBreakdown: Array.from(statusMap.values()).sort((a, b) => b.amount - a.amount),
      methodBreakdown,
      topCustomers,
      averagePayment: calculateAverage(
        report.summary.totalAmount,
        report.summary.totalPayments
      ),
      pendingCount: pendingPayments.length,
      pendingAmount,
      firstPaymentAt,
      lastPaymentAt,
    };
  }, [report]);

  const handleExport = () => {
    if (!report) return;

    const headers = [
      "Date",
      "Customer",
      "Location",
      "Amount Paid",
      "Payment Method",
      "Status",
      "Notes",
    ];

    const rows = report.payments.map((payment) => [
      formatDate(payment.paidAt ?? payment.createdAt),
      payment.customer?.name ?? "Unknown",
      payment.customer?.location ?? "",
      (payment.paidAmount ?? payment.amount ?? 0).toFixed(2),
      payment.paymentMethod ?? "CASH",
      payment.status,
      payment.notes ?? "",
    ]);

    rows.push([
      "TOTAL",
      "",
      "",
      report.summary.totalAmount.toFixed(2),
      "",
      "",
      "",
    ]);

    const csvContent = [
      headers.map(csvValue).join(","),
      ...rows.map((row) => row.map(csvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `daily-payments-${selectedDateISO}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <DailyReportSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/40">
        <AlertTitle>Unable to load daily collections</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (!report || !insights) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No collections data is available for the selected date.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Daily Collections Overview</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Snapshot for {formatDate(selectedDateISO)} {" • "}
            generated {formatDateTime(report.generatedAt)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(selectedDateISO)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onSelectDate(date)}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            {insights.firstPaymentAt && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Started {formatDateTime(insights.firstPaymentAt)}
              </Badge>
            )}
            {insights.lastPaymentAt && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Last entry {formatDateTime(insights.lastPaymentAt)}
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <InsightStat
              label="Average Payment"
              value={formatCurrency(insights.averagePayment)}
              description={`${report.summary.totalPayments} payments`}
              tone="info"
            />
            <InsightStat
              label="Open Credits"
              value={`${insights.pendingCount}`}
              description={`${formatCurrency(insights.pendingAmount)} outstanding`}
              tone={insights.pendingCount > 0 ? "warning" : "success"}
            />
            <InsightStat
              label="Top Method"
              value={
                insights.methodBreakdown[0]
                  ? capitalize(insights.methodBreakdown[0].method.replace(/_/g, " "))
                  : "—"
              }
              description={
                insights.methodBreakdown[0]
                  ? `${formatCurrency(insights.methodBreakdown[0].amount)} · ${insights.methodBreakdown[0].percentage.toFixed(0)}%`
                  : "No payments recorded"
              }
              tone="success"
            />
            <InsightStat
              label="Unique Customers"
              value={insights.topCustomers.length.toString()}
              description="Recorded payments today"
              tone="info"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle>Payment Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most recent payments appear first to highlight today’s activity.
            </p>
          </CardHeader>
          <CardContent>
            {insights.payments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No payments recorded on this date.
              </div>
            ) : (
              <ScrollArea className="max-h-[440px] pr-2">
                <div className="space-y-3">
                  {insights.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border border-border/60 bg-background/60 p-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold leading-tight">
                              {payment.customer?.name ?? "Unknown customer"}
                            </p>
                            {payment.customer?.location && (
                              <LocationBadge
                                location={payment.customer.location}
                                size="sm"
                                showIcon
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(payment.paidAt ?? payment.createdAt)}
                            {payment.notes ? ` • ${payment.notes}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold leading-none">
                            {formatCurrency(payment.paidAmount ?? payment.amount ?? 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {capitalize((payment.paymentMethod ?? "CASH").toLowerCase())}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <SemanticBadge tone={getStatusTone(payment.status)}>
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </SemanticBadge>
                        {payment.saleId && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Sale #{payment.saleId.slice(-6)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.methodBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                insights.methodBreakdown.map((method) => (
                  <div key={method.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {capitalize(method.method.replace(/_/g, " "))}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(method.amount)} · {method.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{ width: `${Math.min(method.percentage, 100)}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payment status information available yet.
                </p>
              ) : (
                insights.statusBreakdown.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <SemanticBadge tone={getStatusTone(status.status)}>
                      {PAYMENT_STATUS_LABELS[status.status]}
                    </SemanticBadge>
                    <div className="flex items-baseline gap-3">
                      <span className="font-semibold">
                        {formatCurrency(status.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {status.count} {status.count === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customer payments recorded yet.</p>
              ) : (
                insights.topCustomers.map((customer) => (
                  <div key={customer.customerId} className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">
                        {customer.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <LocationBadge location={customer.location} size="sm" showIcon />
                        {customer.lastPaymentAt && (
                          <span>Last paid {formatDate(customer.lastPaymentAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(customer.total)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DailyReportSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-[240px]" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-6">
                {Array.from({ length: 3 }).map((__, inner) => (
                  <Skeleton key={inner} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Aging Report Section
// ============================================================================

interface AgingReportSectionProps {
  report?: AgingReportData;
  isLoading: boolean;
  error: unknown;
  selectedDate: Date;
  selectedDateISO: string;
  onSelectDate: (date: Date) => void;
}

function AgingReportSection({
  report,
  isLoading,
  error,
  selectedDate,
  selectedDateISO,
  onSelectDate,
}: AgingReportSectionProps) {
  const insights = useMemo(() => {
    if (!report) return null;

    const bucketTotals = [
      { label: "0-30 days", amount: report.summary.current, tone: "success" as SemanticTone },
      { label: "31-60 days", amount: report.summary.days31to60, tone: "warning" as SemanticTone },
      { label: "61-90 days", amount: report.summary.days61to90, tone: "warning" as SemanticTone },
      { label: "90+ days", amount: report.summary.over90Days, tone: "error" as SemanticTone },
    ];

    const statusBreakdown = report.customers.reduce(
      (acc, customer) => {
        const entry = acc.get(customer.collectionStatus) ?? {
          status: customer.collectionStatus,
          count: 0,
          amount: 0,
        };

        entry.count += 1;
        entry.amount += customer.totalOwed;
        acc.set(customer.collectionStatus, entry);
        return acc;
      },
      new Map<CollectionStatus, { status: CollectionStatus; count: number; amount: number }>()
    );

    const locationBreakdown = report.customers.reduce(
      (acc, customer) => {
        const entry = acc.get(customer.location) ?? {
          location: customer.location,
          amount: 0,
          count: 0,
        };

        entry.amount += customer.totalOwed;
        entry.count += 1;
        acc.set(customer.location, entry);
        return acc;
      },
      new Map<Location, { location: Location; amount: number; count: number }>()
    );

    const topRiskCustomers = [...report.customers]
      .sort((a, b) => b.totalOwed - a.totalOwed)
      .slice(0, MAX_TOP_CUSTOMERS);

    const severelyOverdue = report.customers.filter((customer) => customer.over90Days > 0).length;

    return {
      bucketTotals,
      statusBreakdown: Array.from(statusBreakdown.values()).sort((a, b) => b.amount - a.amount),
      locationBreakdown: Array.from(locationBreakdown.values()).sort((a, b) => b.amount - a.amount),
      topRiskCustomers,
      severelyOverdue,
      averageDebt:
        report.summary.totalCustomers > 0
          ? report.summary.totalOutstanding / report.summary.totalCustomers
          : 0,
    };
  }, [report]);

  const handleExport = () => {
    if (!report) return;

    const headers = [
      "Customer",
      "Location",
      "0-30 days",
      "31-60 days",
      "61-90 days",
      "90+ days",
      "Total Owed",
      "Collection Status",
    ];

    const rows = report.customers.map((customer) => [
      customer.customerName,
      formatLocation(customer.location),
      customer.current.toFixed(2),
      customer.days31to60.toFixed(2),
      customer.days61to90.toFixed(2),
      customer.over90Days.toFixed(2),
      customer.totalOwed.toFixed(2),
      COLLECTION_STATUS_LABELS[customer.collectionStatus],
    ]);

    rows.push([
      "TOTAL",
      "",
      report.summary.current.toFixed(2),
      report.summary.days31to60.toFixed(2),
      report.summary.days61to90.toFixed(2),
      report.summary.over90Days.toFixed(2),
      report.summary.totalOutstanding.toFixed(2),
      "",
    ]);

    const csvContent = [
      headers.map(csvValue).join(","),
      ...rows.map((row) => row.map(csvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `aging-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <AgingReportSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/40">
        <AlertTitle>Unable to load aging report</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (!report || !insights) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No aging information is currently available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Credit Aging Overview</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            As of {formatDate(selectedDateISO)} · {report.summary.totalCustomers} customers · generated {formatDateTime(report.generatedAt)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(selectedDateISO)}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onSelectDate(date)}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {insights.severelyOverdue} severely overdue accounts
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
            {insights.bucketTotals.map((bucket) => (
              <InsightStat
                key={bucket.label}
                label={bucket.label}
                value={formatCurrency(bucket.amount)}
                tone={bucket.tone}
              />
            ))}
            <InsightStat
              label="Average Debt"
              value={formatCurrency(insights.averageDebt)}
              description="Per customer"
              tone="info"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle>Customer Aging Detail</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review outstanding balances and spot accounts that require follow-up.
            </p>
          </CardHeader>
          <CardContent>
            {report.customers.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                All customer balances are cleared.
              </div>
            ) : (
              <ScrollArea className="max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">0-30</TableHead>
                      <TableHead className="text-right">31-60</TableHead>
                      <TableHead className="text-right">61-90</TableHead>
                      <TableHead className="text-right">90+</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.customers.map((customer) => (
                      <TableRow key={customer.customerId}>
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatLocation(customer.location)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.current)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.days31to60)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.days61to90)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(customer.over90Days)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(customer.totalOwed)}
                        </TableCell>
                        <TableCell className="text-right">
                          <SemanticBadge tone={getCollectionTone(customer.collectionStatus)}>
                            {COLLECTION_STATUS_LABELS[customer.collectionStatus]}
                          </SemanticBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Collection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No outstanding balances at the moment.
                </p>
              ) : (
                insights.statusBreakdown.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <SemanticBadge tone={getCollectionTone(status.status)}>
                      {COLLECTION_STATUS_LABELS[status.status]}
                    </SemanticBadge>
                    <div className="flex items-baseline gap-3">
                      <span className="font-semibold">
                        {formatCurrency(status.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {status.count} {status.count === 1 ? "customer" : "customers"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Top Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.locationBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No outstanding balances.</p>
              ) : (
                insights.locationBreakdown.slice(0, 5).map((location) => (
                  <div key={location.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <LocationBadge location={location.location} size="sm" showIcon />
                      <span className="text-muted-foreground">
                        {location.count} {location.count === 1 ? "customer" : "customers"}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(location.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Highest Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.topRiskCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No risk accounts detected.</p>
              ) : (
                insights.topRiskCustomers.map((customer) => (
                  <div key={customer.customerId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold leading-tight">
                        {customer.customerName}
                      </p>
                      <span className="font-semibold">
                        {formatCurrency(customer.totalOwed)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <LocationBadge location={customer.location} size="sm" showIcon />
                      <span>90+ days: {formatCurrency(customer.over90Days)}</span>
                      {customer.lastPaymentDate && (
                        <span>Last paid {formatDate(customer.lastPaymentDate)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AgingReportSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-9 w-28" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-6">
                {Array.from({ length: 3 }).map((__, inner) => (
                  <Skeleton key={inner} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Shared UI Helpers
// ============================================================================

interface InsightStatProps {
  label: string;
  value: string;
  description?: string;
  tone?: SemanticTone;
}

function InsightStat({ label, value, description, tone }: InsightStatProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background/70 px-4 py-3 shadow-sm",
        toneClasses(tone)
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

interface SemanticBadgeProps {
  tone: SemanticTone;
  children: ReactNode;
  className?: string;
}

function SemanticBadge({ tone, children, className }: SemanticBadgeProps) {
  const theme = getSemanticColor(tone);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-xs font-medium",
        theme.bg,
        theme.border,
        theme.text,
        className
      )}
    >
      {children}
    </Badge>
  );
}

