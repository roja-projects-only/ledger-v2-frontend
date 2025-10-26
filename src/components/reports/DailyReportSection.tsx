import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarIcon,
  Clock,
  Download,
  Inbox,
  Loader2,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { InsightStat, SemanticBadge } from "@/components/reports/ReportShared";
import {
  PAYMENT_STATUS_LABELS,
  MAX_TOP_CUSTOMERS,
  csvValue,
  getErrorMessage,
  getStatusTone,
} from "@/components/reports/reportSharedBase";
import {
  calculateAverage,
  capitalize,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import type { DailyPaymentsReportData } from "@/components/reports/types";
import type { Location, Payment, PaymentStatus } from "@/lib/types";

const PENDING_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "PARTIAL",
  "OVERDUE",
  "COLLECTION",
];

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  return new Date(value).getTime();
};

const paymentSorter = (a: Payment, b: Payment) =>
  toTimestamp(b.paidAt ?? b.updatedAt ?? b.createdAt) -
  toTimestamp(a.paidAt ?? a.updatedAt ?? a.createdAt);

const TIMELINE_HEIGHT = "min(60vh, 420px)";
const TIMELINE_HEIGHT_MOBILE = "min(70vh, 360px)";
const SIDE_CARD_MIN_HEIGHT = 176;
const SIDE_CARD_FILL_ROWS = 3;
const TIMELINE_FILL_ROWS = 3;

export interface DailyReportSectionProps {
  report?: DailyPaymentsReportData;
  isLoading: boolean;
  isFetching?: boolean;
  error: unknown;
  selectedDate: Date;
  selectedDateISO: string;
  onSelectDate: (date: Date) => void;
}

export function DailyReportSection({
  report,
  isLoading,
  isFetching,
  error,
  selectedDate,
  selectedDateISO,
  onSelectDate,
}: DailyReportSectionProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const isMobile = useIsMobile();

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
      (sum, payment) =>
        sum + Math.max((payment.amount ?? 0) - (payment.paidAmount ?? 0), 0),
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

  const showLoadingIndicator = (Boolean(isFetching) || isLoading) && Boolean(report);
  const timelineHeight = isMobile ? TIMELINE_HEIGHT_MOBILE : TIMELINE_HEIGHT;
  const timelineMinHeightStyle = { minHeight: timelineHeight };
  const timelineScrollStyle = { maxHeight: timelineHeight };
  const sideCardContentStyle = isMobile ? undefined : { minHeight: SIDE_CARD_MIN_HEIGHT };
  const topCustomerPlaceholderCount = Math.max(
    0,
    (isMobile ? 1 : SIDE_CARD_FILL_ROWS) - (insights?.topCustomers.length ?? 0)
  );

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

  if (isLoading && !report) {
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
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(selectedDateISO)}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={4}
                className="w-auto p-3"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setIsDatePickerOpen(false);
                    onSelectDate(date);
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isLoading || Boolean(isFetching)}
            >
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle>Payment Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most recent payments appear first to highlight today’s activity.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 sm:pb-0 overflow-y-auto sm:overflow-visible" style={timelineMinHeightStyle}>
            <div className="relative overflow-y-auto sm:overflow-visible -mx-4 sm:mx-0 px-4 sm:px-0" style={timelineMinHeightStyle}>
              {showLoadingIndicator && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-background/95 backdrop-blur-sm p-4 sm:p-6 -mx-4 sm:mx-0">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                    <div className="text-center space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Refreshing payments…</h3>
                      <p className="text-xs text-muted-foreground">Pulling the latest entries for the selected date.</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              {insights.payments.length === 0 ? (
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-4 sm:gap-6 rounded-lg border border-dashed border-border/30 bg-background p-4 sm:p-8 text-center"
                >
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-muted rounded-full blur-xl" />
                        <Inbox className="h-12 w-12 text-muted-foreground/40 relative" aria-hidden />
                      </div>
                    </div>
                    <div className="space-y-2 max-w-xs sm:max-w-sm">
                      <h3 className="text-base font-semibold text-foreground">No payments recorded on this date</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed">
                        The payment timeline is empty. Start collecting by logging a new transaction or select a different date to view existing records.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="w-full" style={timelineScrollStyle}>
                  <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-4 px-2 sm:px-0">
                    {insights.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-lg border border-border/60 bg-background/60 p-2 sm:p-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
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
                    {Array.from({
                      length: Math.max(0, TIMELINE_FILL_ROWS - insights.payments.length),
                    }).map((_, index) => (
                      <div
                        key={`payment-placeholder-${index}`}
                        className="rounded-lg border border-dashed border-border/40 bg-muted/10 p-3"
                        aria-hidden
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="xl:h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" style={sideCardContentStyle}>
              {insights.methodBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <>
                  {insights.methodBreakdown.map((method) => (
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
                      <p className="text-xs text-muted-foreground/70">
                        {method.percentage > 50
                          ? "Primary collection method · Dominant payment channel"
                          : method.percentage > 25
                          ? "Secondary collection method · Moderate usage"
                          : "Alternative payment option · Minimal adoption"}
                      </p>
                    </div>
                  ))}

                  <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Collection Overview</p>
                    <div className="text-xs text-muted-foreground/80 space-y-0.5">
                      <p>• Total methods used: {insights.methodBreakdown.length}</p>
                      <p>• Total collected: {formatCurrency(report.summary.totalAmount)}</p>
                      <p>• Avg per method: {formatCurrency(insights.methodBreakdown.length > 0 ? report.summary.totalAmount / insights.methodBreakdown.length : 0)}</p>
                      <p>• Payment diversity: {insights.methodBreakdown.length === 1 ? "Single method only" : `${insights.methodBreakdown.length} methods active`}</p>
                    </div>
                  </div>

                  {insights.methodBreakdown.length === 1 && (
                    <p className="text-xs text-muted-foreground/80">
                      Only {capitalize(insights.methodBreakdown[0].method.replace(/_/g, " "))} payments were collected on this date.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="xl:h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" style={sideCardContentStyle}>
              {insights.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payment status information available yet.
                </p>
              ) : (
                <>
                  {insights.statusBreakdown.map((status) => (
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
                  ))}

                  <div className="mt-2 space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Collection Summary</p>
                    <div className="text-xs text-muted-foreground/80 space-y-0.5">
                      <p>• Total transactions: {insights.statusBreakdown.reduce((sum, s) => sum + s.count, 0)}</p>
                      <p>• Total collected: {formatCurrency(insights.statusBreakdown.reduce((sum, s) => sum + s.amount, 0))}</p>
                      {insights.pendingCount > 0 && (
                        <p>• Pending resolution: {insights.pendingCount} {insights.pendingCount === 1 ? "item" : "items"}</p>
                      )}
                    </div>
                  </div>

                  {insights.statusBreakdown.length === 1 && (
                    <p className="text-xs text-muted-foreground/80">
                      Every recorded payment is currently marked as {PAYMENT_STATUS_LABELS[insights.statusBreakdown[0].status]}.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="xl:h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" style={sideCardContentStyle}>
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
              {Array.from({
                length: topCustomerPlaceholderCount,
              }).map((_, index) => (
                <div
                  key={`customers-placeholder-${index}`}
                  className="flex items-center justify-between gap-3 rounded border border-dashed border-border/40 px-3 py-2 text-xs text-muted-foreground/70"
                  aria-hidden
                >
                  <span>Waiting for activity</span>
                  <span>—</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DailyReportSkeleton() {
  const isMobile = useIsMobile();
  const timelineHeight = isMobile ? TIMELINE_HEIGHT_MOBILE : TIMELINE_HEIGHT;
  const timelineMinHeightStyle = { minHeight: timelineHeight };
  const sideCardContentStyle = isMobile ? undefined : { minHeight: SIDE_CARD_MIN_HEIGHT };

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
          <CardContent className="pb-2 sm:pb-0" style={timelineMinHeightStyle}>
            <div className="space-y-3" style={timelineMinHeightStyle}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-6" style={sideCardContentStyle}>
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
