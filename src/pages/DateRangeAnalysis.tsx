/**
 * Date Range Analysis Page - Analyze sales data over custom date ranges
 * 
 * Features:
 * - Date range selector with presets (Last 7/30 Days, This Month, Custom)
 * - KPI row showing Total Sales, Total Customers, Avg Daily Sales
 * - Daily Sales Trend line chart
 * - Customer Performance bar chart (top 10)
 */

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
//
import { DateRangePicker, DateRangeDisplay } from "@/components/date";
import { KPICard } from "@/components/shared/KPICard";
import { DailySalesTrendChart } from "@/components/analysis/DailySalesTrendChart";
import { CustomerPerformanceChart } from "@/components/analysis/CustomerPerformanceChart";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomerList } from "@/lib/hooks/useCustomers";
import { useKPIs } from "@/lib/hooks/useKPIs";
import type { KPI } from "@/lib/types";
import { formatCurrency, getTodayISO } from "@/lib/utils";

// ============================================================================
// Date Range Analysis Page Component
// ============================================================================

export function DateRangeAnalysis() {
  const { customers, loading: customersLoading } = useCustomerList();
  const { getSalesByDateRange, loading: salesLoading } = useSales();

  // Default to last 7 days in Asia/Manila timezone
  const todayInManila = getTodayISO();
  const [todayYear, todayMonth, todayDay] = todayInManila.split("-").map(Number);
  const today = new Date(todayYear, todayMonth - 1, todayDay);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [startDate, setStartDate] = useState<Date>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date>(today);

  // Get ISO date strings (use local date parts)
  const startDateISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
  const endDateISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  // Get sales for date range
  const rangeSales = getSalesByDateRange(startDateISO, endDateISO);

  // Calculate KPIs using useKPIs hook
  const { getDateRangeKPIs } = useKPIs(rangeSales, customers || []);
  const dateRangeKPIs = useMemo(
    () => getDateRangeKPIs(startDateISO, endDateISO),
    [getDateRangeKPIs, startDateISO, endDateISO]
  );

  const loading = customersLoading || salesLoading;

  // Preset date ranges (use today in Manila timezone)
  const handlePreset = (preset: string) => {
    const end = new Date(todayYear, todayMonth - 1, todayDay);
    let start = new Date(end);

    switch (preset) {
      case "7days":
        start.setDate(end.getDate() - 7);
        break;
      case "30days":
        start.setDate(end.getDate() - 30);
        break;
      case "thisMonth":
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const formatKpiValue = (kpi: KPI) => {
    if (typeof kpi.value !== "number") {
      return kpi.value;
    }

    if (kpi.variant === "revenue" || kpi.variant === "average") {
      return formatCurrency(kpi.value);
    }

    return kpi.value.toLocaleString();
  };

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Date Range Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Analyze sales performance over custom date ranges
            </p>
          </div>

          {/* Date Range Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset("7days")}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset("30days")}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset("thisMonth")}
                  >
                    This Month
                  </Button>
                </div>

                {/* Custom Date Range */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Custom Range</label>
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={(d) => d && setStartDate(d)}
                    onEndDateChange={(d) => d && setEndDate(d)}
                    maxRange={365}
                    maxDate={new Date()}
                  />
                  <div className="text-sm text-muted-foreground">
                    <DateRangeDisplay startDate={startDateISO} endDate={endDateISO} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Row - Smart 2x2 grid on mobile (odd items span full width), 3 columns on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {dateRangeKPIs.map((kpi, index) => (
              <KPICard
                key={index}
                label={kpi.label}
                value={formatKpiValue(kpi)}
                icon={kpi.icon}
                variant={kpi.variant}
                loading={loading}
              />
            ))}
          </div>

          {/* Charts */}
          <div className="space-y-6">
            {/* Daily Sales Trend */}
            <DailySalesTrendChart
              sales={rangeSales}
              startDate={startDateISO}
              endDate={endDateISO}
              loading={loading}
            />

            {/* Customer Performance */}
            <CustomerPerformanceChart
              sales={rangeSales}
              customers={customers || []}
              loading={loading}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
