/**
 * Today Page - Primary data entry page for recording today's sales
 * 
 * Features:
 * - KPI row with 4 key metrics
 * - Two-column layout: entries list | quick add form
 * - Sales by location chart at bottom
 * - Responsive design (stacks on mobile)
 */

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
import { getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency, formatDate, getTodayISO } from "@/lib/utils";
import type { KPI } from "@/lib/types";

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

  // Get today's sales
  const todaySales = getTodaySales();

  // Calculate KPIs
  const { todayKPIs } = useKPIs(todaySales, customers);

  const loading = customersLoading || salesLoading;
  const apiError = customersError || salesError;
  const errorTone = getSemanticColor("error");

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      key: 'k',
      ctrl: true,
      shift: true,
      handler: () => {
        // Focus first input in form (customer search)
        const customerSearch = document.querySelector<HTMLInputElement>('[role="combobox"]');
        customerSearch?.click();
      },
      description: 'New entry',
    },
    {
      key: '/',
      handler: () => {
        // Focus customer search in form
        const customerSearch = document.querySelector<HTMLInputElement>('[role="combobox"]');
        customerSearch?.click();
      },
      description: 'Focus search',
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

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Today's Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <TodayEntriesList
                  sales={todaySales}
                  customers={customers || []}
                  onDelete={(sale) => {
                    const customer = customers?.find(c => c.id === sale.customerId);
                    requestDeleteSale(
                      sale.id,
                      customer?.name || 'Unknown',
                      `₱${(sale.quantity * sale.unitPrice).toFixed(2)}`,
                      new Date(sale.date).toLocaleDateString()
                    );
                  }}
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Right Column - Quick Add Entry */}
            <QuickAddForm
              customers={customers || []}
              userId={user?.id || ""}
              onSave={(saleData) => {
                addSale(saleData);
              }}
              loading={loading}
            />
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
