import { useMemo, useState, useRef } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PastDatePicker } from "@/components/shared/DatePicker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { InsightStat, SemanticBadge } from "@/components/reports/ReportShared";
import {
  PAYMENT_STATUS_LABELS,
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
import { useMatchHeight } from "@/lib/hooks/useMatchHeight";
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

const TOP_CUSTOMERS_LIMIT = 3; // Show only top 3 customers

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

  const isMobile = useIsMobile();

  // Refs for height matching
  const sideCardsRef = useRef<HTMLDivElement>(null);

  const insights = useMemo(() => {
    if (!report) return null;

    const payments = [...report.payments].sort(paymentSorter);

    const statusMap = payments.reduce((acc, payment) => {
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
    }, new Map<PaymentStatus, { status: PaymentStatus; count: number; amount: number }>());

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
          lastPaymentAt:
            payment.paidAt ?? payment.updatedAt ?? payment.createdAt,
        };

        existing.total += payment.paidAmount ?? payment.amount ?? 0;
        const candidate =
          payment.paidAt ?? payment.updatedAt ?? payment.createdAt;
        if (
          candidate &&
          toTimestamp(candidate) > toTimestamp(existing.lastPaymentAt)
        ) {
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
      .slice(0, TOP_CUSTOMERS_LIMIT);

    const pendingPayments = payments.filter((payment) =>
      PENDING_STATUSES.includes(payment.status)
    );

    const pendingAmount = pendingPayments.reduce(
      (sum, payment) =>
        sum + Math.max((payment.amount ?? 0) - (payment.paidAmount ?? 0), 0),
      0
    );

    const firstPaymentAt =
      payments.at(-1)?.paidAt ?? payments.at(-1)?.createdAt;
    const lastPaymentAt = payments.at(0)?.paidAt ?? payments.at(0)?.createdAt;

    return {
      payments,
      statusBreakdown: Array.from(statusMap.values()).sort(
        (a, b) => b.amount - a.amount
      ),
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

  const hasData = report && insights;

  // Match height after insights is calculated
  const matchedHeight = useMatchHeight(sideCardsRef, [
    report,
    insights,
    hasData,
  ]);

  const showLoadingIndicator =
    (Boolean(isFetching) || isLoading) && Boolean(report);

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
        <AlertDescription>
          {getErrorMessage(error)}. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {hasData && (
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
              <PastDatePicker
                value={selectedDate}
                onChange={(date) => date && onSelectDate(date)}
                className="w-[240px]"
                ariaLabel="Select date for daily report"
              />

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
                description={`${formatCurrency(
                  insights.pendingAmount
                )} outstanding`}
                tone={insights.pendingCount > 0 ? "warning" : "success"}
              />
              <InsightStat
                label="Top Method"
                value={
                  insights.methodBreakdown[0]
                    ? capitalize(
                        insights.methodBreakdown[0].method.replace(/_/g, " ")
                      )
                    : "—"
                }
                description={
                  insights.methodBreakdown[0]
                    ? `${formatCurrency(
                        insights.methodBreakdown[0].amount
                      )} · ${insights.methodBreakdown[0].percentage.toFixed(
                        0
                      )}%`
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
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        {/* Payment Timeline - Left Column */}
        <Card
          className="flex flex-col"
          style={{
            height: isMobile
              ? "auto"
              : matchedHeight
              ? `${matchedHeight}px`
              : "500px",
            minHeight: isMobile ? "400px" : undefined,
          }}
        >
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle>Payment Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most recent payments appear first to highlight today's activity.
            </p>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <div className="relative h-full px-6 pb-6">
              {showLoadingIndicator && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/95 backdrop-blur-sm">
                  <Loader2
                    className="h-6 w-6 animate-spin text-primary"
                    aria-hidden
                  />
                  <p className="text-xs text-muted-foreground">
                    Refreshing payments…
                  </p>
                </div>
              )}
              {!hasData || insights.payments.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/30 bg-muted/20 p-6 text-center">
                  <Inbox
                    className="h-10 w-10 text-muted-foreground/40"
                    aria-hidden
                  />
                  <div className="space-y-1 max-w-xs">
                    <h3 className="text-sm font-semibold text-foreground">
                      No payments recorded on this date
                    </h3>
                    <p className="text-xs text-muted-foreground/80">
                      Select a different date or log a new transaction.
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full w-full">
                  <div className="space-y-2 sm:space-y-3 pr-4">
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
                              {formatDateTime(
                                payment.paidAt ?? payment.createdAt
                              )}
                              {payment.notes ? ` • ${payment.notes}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold leading-none">
                              {formatCurrency(
                                payment.paidAmount ?? payment.amount ?? 0
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {capitalize(
                                (payment.paymentMethod ?? "CASH").toLowerCase()
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                          <SemanticBadge tone={getStatusTone(payment.status)}>
                            {PAYMENT_STATUS_LABELS[payment.status]}
                          </SemanticBadge>
                          {payment.saleId && (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Sale #{payment.saleId.slice(-6)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side Cards - Right Column */}
        <div ref={sideCardsRef} className="space-y-4">
          {/* Payment Methods Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasData || insights.methodBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <>
                  {insights.methodBreakdown.map((method) => (
                    <div key={method.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {capitalize(method.method.replace(/_/g, " "))}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(method.amount)} ·{" "}
                          {method.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-sky-500"
                          style={{
                            width: `${Math.min(method.percentage, 100)}%`,
                          }}
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
                    <p className="text-xs font-medium text-muted-foreground">
                      Collection Overview
                    </p>
                    <div className="text-xs text-muted-foreground/80 space-y-0.5">
                      <p>
                        • Total methods used: {insights.methodBreakdown.length}
                      </p>
                      <p>
                        • Total collected:{" "}
                        {formatCurrency(report.summary.totalAmount)}
                      </p>
                      <p>
                        • Avg per method:{" "}
                        {formatCurrency(
                          insights.methodBreakdown.length > 0
                            ? report.summary.totalAmount /
                                insights.methodBreakdown.length
                            : 0
                        )}
                      </p>
                      <p>
                        • Payment diversity:{" "}
                        {insights.methodBreakdown.length === 1
                          ? "Single method only"
                          : `${insights.methodBreakdown.length} methods active`}
                      </p>
                    </div>
                  </div>

                  {insights.methodBreakdown.length === 1 && (
                    <p className="text-xs text-muted-foreground/80">
                      Only{" "}
                      {capitalize(
                        insights.methodBreakdown[0].method.replace(/_/g, " ")
                      )}{" "}
                      payments were collected on this date.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasData || insights.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payment status information available yet.
                </p>
              ) : (
                <>
                  {insights.statusBreakdown.map((status) => (
                    <div
                      key={status.status}
                      className="flex items-center justify-between"
                    >
                      <SemanticBadge tone={getStatusTone(status.status)}>
                        {PAYMENT_STATUS_LABELS[status.status]}
                      </SemanticBadge>
                      <div className="flex items-baseline gap-3">
                        <span className="font-semibold">
                          {formatCurrency(status.amount)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {status.count}{" "}
                          {status.count === 1 ? "entry" : "entries"}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 space-y-1.5 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Collection Summary
                    </p>
                    <div className="text-xs text-muted-foreground/80 space-y-0.5">
                      <p>
                        • Total transactions:{" "}
                        {insights.statusBreakdown.reduce(
                          (sum, s) => sum + s.count,
                          0
                        )}
                      </p>
                      <p>
                        • Total collected:{" "}
                        {formatCurrency(
                          insights.statusBreakdown.reduce(
                            (sum, s) => sum + s.amount,
                            0
                          )
                        )}
                      </p>
                      {insights.pendingCount > 0 && (
                        <p>
                          • Pending resolution: {insights.pendingCount}{" "}
                          {insights.pendingCount === 1 ? "item" : "items"}
                        </p>
                      )}
                    </div>
                  </div>

                  {insights.statusBreakdown.length === 1 && (
                    <p className="text-xs text-muted-foreground/80">
                      Every recorded payment is currently marked as{" "}
                      {
                        PAYMENT_STATUS_LABELS[
                          insights.statusBreakdown[0].status
                        ]
                      }
                      .
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Customers Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasData || insights.topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No customer payments recorded yet.
                </p>
              ) : (
                insights.topCustomers.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">
                        {customer.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <LocationBadge
                          location={customer.location}
                          size="sm"
                          showIcon
                        />
                        {customer.lastPaymentAt && (
                          <span>
                            Last paid {formatDate(customer.lastPaymentAt)}
                          </span>
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

export function DailyReportSkeleton() {
  const isMobile = useIsMobile();
  const sideCardsRef = useRef<HTMLDivElement>(null);
  const matchedHeight = useMatchHeight(sideCardsRef, []);

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
        <Card
          style={{
            height: isMobile
              ? "auto"
              : matchedHeight
              ? `${matchedHeight}px`
              : "500px",
            minHeight: isMobile ? "400px" : undefined,
          }}
        >
          <CardContent className="pt-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div ref={sideCardsRef} className="space-y-4">
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
