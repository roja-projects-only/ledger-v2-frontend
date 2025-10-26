/**
 * Reports Page - Payment reports and analytics
 *
 * Features:
 * - Daily payments received report
 * - Aging report with export to CSV
 * - Customer payment history reports
 */

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/shared/KPICard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { getSemanticColor } from "@/lib/colors";
import {
  CalendarIcon,
  Download,
  DollarSign,
  Receipt,
  Clock,
} from "lucide-react";
import type { Payment } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface AgingReportData {
  summary: {
    totalCustomers: number;
    totalOutstanding: number;
    current: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
  };
  customers: Array<{
    customerId: string;
    customerName: string;
    location: string;
    current: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
    totalOwed: number;
    collectionStatus: string;
  }>;
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
// Reports Page Component
// ============================================================================

export function Reports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateISO = selectedDate.toISOString().split("T")[0];

  // Fetch daily payments report
  const {
    data: dailyReport,
    isLoading: dailyLoading,
    error: dailyError,
  } = useQuery<DailyPaymentsReportData>({
    queryKey: queryKeys.payments.dailyReport(selectedDateISO),
    queryFn: () => paymentsApi.getDailyPaymentsReport(selectedDateISO),
  });

  // Fetch aging report
  const {
    data: agingReport,
    isLoading: agingLoading,
    error: agingError,
  } = useQuery<AgingReportData>({
    queryKey: queryKeys.payments.agingReport(),
    queryFn: paymentsApi.getAgingReport,
  });

  // ============================================================================
  // CSV Export Functions
  // ============================================================================

  const exportAgingReportToCSV = () => {
    if (!agingReport) return;

    const headers = [
      "Customer Name",
      "Location",
      "Current (0-30 days)",
      "31-60 Days",
      "61-90 Days",
      "90+ Days",
      "Total Owed",
      "Collection Status",
    ];

    const rows = agingReport.customers.map((customer) => [
      customer.customerName,
      customer.location,
      customer.current.toFixed(2),
      customer.days31to60.toFixed(2),
      customer.days61to90.toFixed(2),
      customer.over90Days.toFixed(2),
      customer.totalOwed.toFixed(2),
      customer.collectionStatus,
    ]);

    // Add summary row
    rows.push([
      "TOTAL",
      "",
      agingReport.summary.current.toFixed(2),
      agingReport.summary.days31to60.toFixed(2),
      agingReport.summary.days61to90.toFixed(2),
      agingReport.summary.over90Days.toFixed(2),
      agingReport.summary.totalOutstanding.toFixed(2),
      "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `aging-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDailyReportToCSV = () => {
    if (!dailyReport) return;

    const headers = [
      "Date",
      "Customer",
      "Location",
      "Amount Paid",
      "Payment Method",
      "Status",
      "Notes",
    ];

    const rows = dailyReport.payments.map((payment) => [
      formatDate(payment.paidAt || payment.createdAt),
      payment.customer?.name || "Unknown",
      payment.customer?.location || "",
      payment.paidAmount.toFixed(2),
      payment.paymentMethod || "CASH",
      payment.status,
      payment.notes || "",
    ]);

    // Add summary row
    rows.push([
      "TOTAL",
      "",
      "",
      dailyReport.summary.totalAmount.toFixed(2),
      "",
      "",
      "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `daily-payments-${selectedDateISO}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const errorTone = getSemanticColor("error");
  const infoTone = getSemanticColor("info");

  const renderDailyReport = () => {
    if (dailyLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (dailyError) {
      return (
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
          <p className="font-medium">Unable to load daily payments report.</p>
          <p className={cn("text-xs", errorTone.subtext)}>
            {dailyError instanceof Error ? dailyError.message : "Unknown error"}
            . Please try again.
          </p>
        </div>
      );
    }

    if (!dailyReport) return null;

    return (
      <div className="space-y-6">
        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDateISO : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="sm"
                onClick={exportDailyReportToCSV}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            icon={Receipt}
            label="Total Payments"
            value={dailyReport?.summary.totalPayments ?? 0}
            semanticTone="info"
            loading={dailyLoading}
          />
          <KPICard
            icon={DollarSign}
            label="Total Amount"
            value={dailyLoading ? "₱0.00" : formatCurrency(dailyReport?.summary.totalAmount ?? 0)}
            semanticTone="success"
            loading={dailyLoading}
          />
          {dailyLoading ? (
            <KPICard
              icon={Receipt}
              label="Payment Methods"
              value="Loading..."
              semanticTone="info"
              loading={true}
            />
          ) : (
            <Card
              className={cn(
                "h-full border-2",
                infoTone.bg,
                infoTone.border
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1 space-y-1.5 text-sm">
                {Object.entries(dailyReport?.summary.paymentMethods ?? {}).map(
                  ([method, amount]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between rounded-md bg-background/40 px-2 py-1"
                    >
                      <span className="text-muted-foreground">{method}</span>
                      <span className="font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyReport.payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments received on this date
              </div>
            ) : (
              <div className="space-y-2">
                {dailyReport.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {payment.customer?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.customer?.location || ""} •{" "}
                        {payment.paymentMethod || "CASH"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(payment.paidAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAgingReport = () => {
    if (agingLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (agingError) {
      return (
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
          <p className="font-medium">Unable to load aging report.</p>
          <p className={cn("text-xs", errorTone.subtext)}>
            {agingError instanceof Error ? agingError.message : "Unknown error"}
            . Please try again.
          </p>
        </div>
      );
    }

    if (!agingReport) return null;

    return (
      <div className="space-y-6">
        {/* Export Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportAgingReportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            icon={DollarSign}
            label="0-30 days"
            value={agingLoading ? "₱0.00" : formatCurrency(agingReport?.summary.current ?? 0)}
            semanticTone="success"
            loading={agingLoading}
          />
          <KPICard
            icon={Clock}
            label="31-60 days"
            value={agingLoading ? "₱0.00" : formatCurrency(agingReport?.summary.days31to60 ?? 0)}
            semanticTone="warning"
            loading={agingLoading}
          />
          <KPICard
            icon={Clock}
            label="61-90 days"
            value={agingLoading ? "₱0.00" : formatCurrency(agingReport?.summary.days61to90 ?? 0)}
            semanticTone="warning"
            loading={agingLoading}
          />
          <KPICard
            icon={Clock}
            label="90+ days"
            value={agingLoading ? "₱0.00" : formatCurrency(agingReport?.summary.over90Days ?? 0)}
            semanticTone="error"
            loading={agingLoading}
          />
        </div>

        {/* Aging Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Aging Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Customer</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-right p-2 font-medium">0-30 days</th>
                    <th className="text-right p-2 font-medium">31-60 days</th>
                    <th className="text-right p-2 font-medium">61-90 days</th>
                    <th className="text-right p-2 font-medium">90+ days</th>
                    <th className="text-right p-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {agingReport.customers.map((customer) => (
                    <tr key={customer.customerId} className="border-b">
                      <td className="p-2">{customer.customerName}</td>
                      <td className="p-2">{customer.location}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(customer.current)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(customer.days31to60)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(customer.days61to90)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(customer.over90Days)}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {formatCurrency(customer.totalOwed)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/50">
                    <td className="p-2" colSpan={2}>
                      TOTAL
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(agingReport.summary.current)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(agingReport.summary.days31to60)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(agingReport.summary.days61to90)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(agingReport.summary.over90Days)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(agingReport.summary.totalOutstanding)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Payment Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              View and export payment reports and analytics
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList>
              <TabsTrigger value="daily">
                <Receipt className="mr-2 h-4 w-4" />
                Daily Payments
              </TabsTrigger>
              <TabsTrigger value="aging">
                <Clock className="mr-2 h-4 w-4" />
                Aging Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">{renderDailyReport()}</TabsContent>
            <TabsContent value="aging">{renderAgingReport()}</TabsContent>
          </Tabs>
        </div>
      </Container>
    </div>
  );
}
