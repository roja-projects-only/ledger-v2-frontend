import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { KPICard } from "@/components/shared/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";
import { formatCurrency } from "@/lib/utils";
import { DailyReportSection } from "@/components/reports/DailyReportSection";
import { AgingReportSection } from "@/components/reports/AgingReportSection";
import type {
  AgingReportData,
  DailyPaymentsReportData,
} from "@/components/reports/types";
import {
  AlertCircle,
  Clock,
  DollarSign,
  Receipt,
  Users,
} from "lucide-react";

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
