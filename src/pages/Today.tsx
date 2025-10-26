/**
 * Today Page - Primary data entry page for recording today's sales
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - Delete confirmations use getEffectivePrice() for accurate totals
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - KPI row with 4 key metrics
 * - Two-column layout: entries list | quick add form
 * - Sales by location chart at bottom
 * - Responsive design (stacks on mobile)
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { KPICard } from "@/components/shared/KPICard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAddForm } from "@/components/today/QuickAddForm";
import { TodayEntriesList } from "@/components/today/TodayEntriesList";
import { SalesByLocationChart } from "@/components/today/SalesByLocationChart";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useAuth } from "@/lib/hooks/useAuth";
import { useKPIs } from "@/lib/hooks/useKPIs";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import { usePricing } from "@/lib/hooks/usePricing";
import { getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency, formatDate, getTodayISO } from "@/lib/utils";
import type { KPI } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/lib/api/payments.api";
import { queryKeys } from "@/lib/queryKeys";

// ============================================================================
// Today Page Component
// ============================================================================

export function Today() {
  const { user } = useAuth();
  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();
  const {
    addSale,
    getTodaySales,
    requestDeleteSale,
    confirmDeleteSale,
    cancelDeleteSale,
    deleteConfirmation,
    loading: salesLoading,
    error: salesError,
  } = useSales();
  const { getEffectivePrice } = usePricing();

  // Refs for syncing heights
  const formRef = useRef<HTMLDivElement>(null);
  const entriesCardRef = useRef<HTMLDivElement>(null);
  const [entriesHeight, setEntriesHeight] = useState<number | null>(null);

  // Get today's sales
  const todaySales = getTodaySales();

  // Sync Today's Entries card height with QuickAddForm
  useEffect(() => {
    if (!formRef.current || !entriesCardRef.current) return;

    const observer = new ResizeObserver(() => {
      const formHeight = formRef.current?.offsetHeight;
      if (formHeight) {
        setEntriesHeight(formHeight);
      }
    });

    observer.observe(formRef.current);
    
    // Initial measurement
    const initialHeight = formRef.current.offsetHeight;
    if (initialHeight) {
      setEntriesHeight(initialHeight);
    }

    return () => observer.disconnect();
  }, []);

  // Calculate KPIs
  const { todayKPIs } = useKPIs(todaySales, customers);

  // Fetch payment summary for outstanding balance KPI
  const { data: paymentSummary } = useQuery({
    queryKey: queryKeys.payments.summary(),
    queryFn: paymentsApi.getPaymentSummary,
  });

  // Calculate credit vs cash sales ratio for today
  const creditVsCashRatio = useMemo(() => {
    const creditSales = todaySales.filter(s => s.paymentType === 'CREDIT').length;
    const cashSales = todaySales.filter(s => s.paymentType === 'CASH').length;
    const total = creditSales + cashSales;
    
    return {
      creditCount: creditSales,
      cashCount: cashSales,
      creditPercentage: total > 0 ? (creditSales / total) * 100 : 0,
      cashPercentage: total > 0 ? (cashSales / total) * 100 : 0,
    };
  }, [todaySales]);

  const loading = customersLoading || salesLoading;
  const apiError = customersError || salesError;
  const errorTone = getSemanticColor("error");

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      key: 'n',
      ctrl: true,
      shift: true,
      alt: true,
      handler: () => {
        // Focus first input in form (customer search)
        const customerSearch = document.querySelector<HTMLInputElement>('[role="combobox"]');
        customerSearch?.click();
      },
      description: 'New entry (Ctrl+Shift+Alt+N)',
    },
    {
      key: '/',
      handler: () => {
        // Focus customer search in form
        const customerSearch = document.querySelector<HTMLInputElement>('[role="combobox"]');
        customerSearch?.click();
      },
      description: 'Focus search (/)',
    },
  ]);

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
            <h1 className="text-3xl font-bold tracking-tight">Today</h1>
            <p className="text-muted-foreground mt-1">
              {formatDate(getTodayISO())}
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              aria-live="polite"
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                errorTone.bg,
                errorTone.border,
                errorTone.text,
              )}
            >
              <p className="font-medium">Unable to load data from server.</p>
              <p className={cn("text-xs", errorTone.subtext)}>
                {apiError}. Please check your connection and try again.
              </p>
            </div>
          )}

          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {todayKPIs.map((kpi, index) => (
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

          {/* Payment Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outstanding Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Outstanding Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Outstanding</span>
                    <span className="text-lg font-bold">
                      {paymentSummary ? formatCurrency(paymentSummary.totalOutstanding) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customers with Debt</span>
                    <span className="text-sm font-medium">
                      {paymentSummary ? paymentSummary.customersWithDebt : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payments Today</span>
                    <span className="text-sm font-medium">
                      {paymentSummary ? formatCurrency(paymentSummary.totalPaymentsToday) : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credit vs Cash Sales Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Today's Sales Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cash Sales</span>
                      <span className="font-medium">
                        {creditVsCashRatio.cashCount} ({creditVsCashRatio.cashPercentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${creditVsCashRatio.cashPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credit Sales</span>
                      <span className="font-medium">
                        {creditVsCashRatio.creditCount} ({creditVsCashRatio.creditPercentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all"
                        style={{ width: `${creditVsCashRatio.creditPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Today's Entries with dynamic height */}
            <Card 
              ref={entriesCardRef}
              className="flex flex-col"
              style={{ height: entriesHeight ? `${entriesHeight}px` : 'auto' }}
            >
              <CardHeader className="flex-shrink-0">
                <CardTitle>Today's Entries</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 px-4 pb-4 lg:px-6 lg:pb-0">
                <TodayEntriesList
                  sales={todaySales}
                  customers={customers || []}
                  onDelete={(sale) => {
                    const customer = customers?.find(c => c.id === sale.customerId);
                    const effectivePrice = customer ? getEffectivePrice(customer) : sale.unitPrice;
                    const recalculatedTotal = sale.quantity * effectivePrice;
                    requestDeleteSale(
                      sale.id,
                      customer?.name || 'Unknown',
                      `₱${recalculatedTotal.toFixed(2)}`,
                      new Date(sale.date).toLocaleDateString()
                    );
                  }}
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Right Column - Quick Add Entry (reference element) */}
            <div ref={formRef}>
              <QuickAddForm
                customers={customers || []}
                userId={user?.id || ""}
                onSave={(saleData) => {
                  addSale(saleData);
                }}
                loading={loading}
              />
            </div>
          </div>

          {/* Sales by Location Chart */}
          <SalesByLocationChart
            sales={todaySales}
            customers={customers || []}
            loading={loading}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmation.open}
          onOpenChange={(open) => !open && cancelDeleteSale()}
          title="Delete Sale"
          description={
            deleteConfirmation.saleDetails
              ? `Are you sure you want to delete this sale?\n\nCustomer: ${deleteConfirmation.saleDetails.customer}\nAmount: ${deleteConfirmation.saleDetails.amount}\nDate: ${deleteConfirmation.saleDetails.date}`
              : 'Are you sure you want to delete this sale?'
          }
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteSale}
          variant="destructive"
        />
      </Container>
    </div>
  );
}
