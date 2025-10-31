import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { InsightStat, SemanticBadge } from "@/components/reports/ReportShared";
import {
  COLLECTION_STATUS_LABELS,
  MAX_TOP_CUSTOMERS,
  csvValue,
  getCollectionTone,
  getErrorMessage,
} from "@/components/reports/reportSharedBase";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLocation,
  toLocalISODate,
} from "@/lib/utils";
import type { CollectionStatus, Location } from "@/lib/types";
import type { AgingReportData } from "@/components/reports/types";
import {
  AlertCircle,
  BarChart3,
  Clock,
  Download,
  MapPin,
  TrendingUp,
} from "lucide-react";

const TOP_RANK_LIMIT = 3;

export interface AgingReportSectionProps {
  report?: AgingReportData;
  isLoading: boolean;
  error: unknown;
}

export function AgingReportSection({
  report,
  isLoading,
  error,
}: AgingReportSectionProps) {
  const insights = useMemo(() => {
    if (!report) return null;

    const bucketTotals = [
      { label: "0-30 days", amount: report.summary.current, tone: "success" as const },
      { label: "31-60 days", amount: report.summary.days31to60, tone: "warning" as const },
      { label: "61-90 days", amount: report.summary.days61to90, tone: "warning" as const },
      { label: "90+ days", amount: report.summary.over90Days, tone: "error" as const },
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
      .slice(0, Math.min(MAX_TOP_CUSTOMERS, TOP_RANK_LIMIT));

    const severelyOverdue = report.customers.filter((customer) => customer.over90Days > 0).length;

    return {
      bucketTotals,
      statusBreakdown: Array.from(statusBreakdown.values()).sort((a, b) => b.amount - a.amount),
      locationBreakdown: Array.from(locationBreakdown.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_RANK_LIMIT),
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
    const exportDate = toLocalISODate(new Date(report.generatedAt ?? Date.now()));

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
    link.download = `aging-report-${exportDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !report) {
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
            As of {formatDate(report.generatedAt)} · {report.summary.totalCustomers} customers · generated {formatDateTime(report.generatedAt)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {insights.severelyOverdue} severely overdue accounts
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              Generated {formatDateTime(report.generatedAt)}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1">
            <CardTitle>Customer Aging Detail</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review outstanding balances and spot accounts that require follow-up.
            </p>
          </CardHeader>
          <CardContent className="pb-2 sm:pb-6">
            {report.customers.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                All customer balances are cleared.
              </div>
            ) : (
              <ScrollArea className="h-[min(60vh,520px)] sm:h-[520px] pr-2">
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

export function AgingReportSkeleton() {
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
