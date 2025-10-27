/**
 * Customer History Page - View detailed purchase history for a specific customer
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - Delete confirmations use getEffectivePrice() for accurate totals
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Customer selector (Combobox with search)
 * - Customer summary card with KPIs
 * - Purchase timeline grouped by date
 * - Most recent purchases first
 */

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, User, CalendarIcon } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { CustomerDebtHistoryModal } from "@/components/shared/CustomerDebtHistoryModal";
import { PaymentRecordingModal } from "@/components/shared/PaymentRecordingModal";
import { PurchaseTimeline } from "@/components/customer-history/PurchaseTimeline";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useKPIs } from "@/lib/hooks/useKPIs";
import { usePricing } from "@/lib/hooks/usePricing";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { notify } from "@/lib/notifications";
import { useDebtData } from "@/lib/hooks/useDebtData";
import { DebtErrorBoundary } from "@/components/shared/DebtErrorBoundary";
import { DebtKPICard } from "@/components/shared/DebtKPICard";
import { DebtManagementSection } from "@/components/shared/DebtManagementSection";
import type { KPI } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

// ============================================================================
// Customer History Page Component
// ============================================================================

export function CustomerHistory() {
  const queryClient = useQueryClient();
  const { customers, loading: customersLoading } = useCustomers();
  const { 
    getSalesByCustomer, 
    requestDeleteSale,
    confirmDeleteSale,
    cancelDeleteSale,
    deleteConfirmation,
    loading: salesLoading 
  } = useSales();
  const { getEffectivePrice } = usePricing();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  // Fetch customer debt data with error handling
  const {
    outstandingBalance,
    isLoading: outstandingBalanceLoading,
    isError: debtError,
    error: debtErrorDetails,
    isDebtServiceAvailable,
    retry: retryDebtData,
    refetch: refetchOutstandingBalance,
  } = useDebtData({
    customerId: selectedCustomerId,
    enabled: !!selectedCustomerId,
  });


  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [datePickerStep, setDatePickerStep] = useState<"from" | "to">("from");
  
  // Debt management modal states
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Date range state (default: last 30 days)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { from: thirtyDaysAgo, to: today };
  });
  const [showAllTime, setShowAllTime] = useState(false);

  // Get selected customer
  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);

  // Get all sales for selected customer
  const allCustomerSales = selectedCustomerId
    ? getSalesByCustomer(selectedCustomerId)
    : [];

  // Filter sales by date range
  const customerSales = useMemo(() => {
    if (showAllTime) return allCustomerSales;

    return allCustomerSales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });
  }, [allCustomerSales, dateRange, showAllTime]);

  // Date range presets
  const setDateRangePreset = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setDateRange({ from: pastDate, to: today });
    setShowAllTime(false);
  };

  const handleAllTime = () => {
    setShowAllTime(true);
  };

  // Calculate customer KPIs based on filtered sales
  const { getCustomerKPIs } = useKPIs(customerSales, customers || []);
  const baseCustomerKPIs = useMemo(
    () => (selectedCustomerId ? getCustomerKPIs(selectedCustomerId) : []),
    [getCustomerKPIs, selectedCustomerId]
  );

  // Enhanced customer KPIs including debt information
  const customerKPIs = useMemo(() => {
    // Only include base KPIs, debt KPI is handled separately
    return baseCustomerKPIs;
  }, [baseCustomerKPIs]);

  const loading = customersLoading || salesLoading || outstandingBalanceLoading;
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
            <h1 className="text-3xl font-bold tracking-tight">Customer History</h1>
            <p className="text-muted-foreground mt-1">
              View detailed purchase history for each customer
            </p>
          </div>

          {/* Customer Selector */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Select Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full justify-between min-w-0"
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">{selectedCustomer.name}</span>
                        <span className="text-muted-foreground text-sm shrink-0 hidden sm:inline">
                          ({selectedCustomer.location})
                        </span>
                      </span>
                    ) : (
                      <span className="truncate">Select a customer...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers?.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.location}`}
                            onSelect={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearchOpen(false);
                            }}
                            className="min-w-0"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                selectedCustomerId === customer.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <User className="h-4 w-4 shrink-0" />
                              <span className="truncate flex-1">{customer.name}</span>
                              <span className="text-muted-foreground text-sm shrink-0 hidden sm:inline">
                                ({customer.location})
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Date Range Filter */}
          {selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quick Presets */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 7)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(7)}
                      className="h-9"
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 30)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(30)}
                      className="h-9"
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 90)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(90)}
                      className="h-9"
                    >
                      Last 90 days
                    </Button>
                    <Button
                      variant={showAllTime ? "default" : "outline"}
                      size="sm"
                      onClick={handleAllTime}
                      className="h-9"
                    >
                      All Time
                    </Button>
                  </div>

                  {/* Custom Date Range Picker */}
                  {!showAllTime && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setDateRangeOpen(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDate(dateRange.from.toISOString())} - {formatDate(dateRange.to.toISOString())}
                      </Button>

                      {/* Date Range Modal */}
                      <Dialog open={dateRangeOpen} onOpenChange={(open) => {
                        setDateRangeOpen(open);
                        if (open) {
                          setDatePickerStep("from");
                        }
                      }}>
                        <DialogContent className="w-[min(90vw,340px)] p-3 gap-3 overflow-hidden">
                          <DialogHeader className="space-y-2">
                            <DialogTitle className="text-base">
                              Select {datePickerStep === "from" ? "Start" : "End"} Date
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              {datePickerStep === "from" 
                                ? "Choose the first date of your range"
                                : `End date must be after ${formatDate(dateRange.from.toISOString())}`
                              }
                            </DialogDescription>
                          </DialogHeader>

                          {/* Calendar */}
                          <div className="flex justify-center py-1">
                            <div className="scale-90 origin-top">
                              <Calendar
                                mode="single"
                                selected={datePickerStep === "from" ? dateRange.from : dateRange.to}
                                onSelect={(date) => {
                                  if (!date) return;
                                  
                                  if (datePickerStep === "from") {
                                    setDateRange({ ...dateRange, from: date });
                                  } else {
                                    setDateRange({ ...dateRange, to: date });
                                    setDateRangeOpen(false);
                                  }
                                }}
                                disabled={(date) => {
                                  if (datePickerStep === "from") {
                                    return date > new Date() || date > dateRange.to;
                                  } else {
                                    return date > new Date() || date < dateRange.from;
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 justify-end pt-1 border-t">
                            {datePickerStep === "from" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDateRangeOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setDatePickerStep("to")}
                                >
                                  Next →
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDatePickerStep("from")}
                                >
                                  ← Back
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setDateRangeOpen(false)}
                                >
                                  Done
                                </Button>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {/* Stats */}
                  <div className="text-sm text-muted-foreground">
                    {showAllTime ? (
                      <span>Showing all {allCustomerSales.length} purchases</span>
                    ) : (
                      <span>
                        Showing {customerSales.length} of {allCustomerSales.length} purchases
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Summary (only show if customer selected) */}
          {selectedCustomer && (
            <>
              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {customerKPIs.map((kpi, index) => (
                  <KPICard
                    key={index}
                    label={kpi.label}
                    value={formatKpiValue(kpi)}
                    icon={kpi.icon}
                    variant={kpi.variant}
                    semanticTone={kpi.semanticTone}
                    loading={loading}
                  />
                ))}
                
                {/* Debt KPI with error handling */}
                <DebtErrorBoundary
                  fallbackTitle="Debt KPI Unavailable"
                  fallbackMessage="Unable to load outstanding balance information."
                  onRetry={retryDebtData}
                >
                  <DebtKPICard
                    outstandingBalance={outstandingBalance}
                    isLoading={outstandingBalanceLoading}
                    isError={debtError}
                    isDebtServiceAvailable={isDebtServiceAvailable}
                    onRetry={retryDebtData}
                    className={customerKPIs.length === 4 ? "col-span-2 lg:col-span-1" : ""}
                  />
                </DebtErrorBoundary>
              </div>

              {/* Debt Management Actions with Error Handling */}
              <DebtErrorBoundary
                fallbackTitle="Debt Management Unavailable"
                fallbackMessage="Unable to load debt management features. You can still view purchase history."
                onRetry={retryDebtData}
              >
                <DebtManagementSection
                  outstandingBalance={outstandingBalance}
                  isLoading={outstandingBalanceLoading}
                  isError={debtError}
                  error={debtErrorDetails}
                  isDebtServiceAvailable={isDebtServiceAvailable}
                  onViewDebtHistory={() => setDebtModalOpen(true)}
                  onRecordPayment={() => setPaymentModalOpen(true)}
                  onRetry={retryDebtData}
                />
              </DebtErrorBoundary>

              {/* Purchase Timeline */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Purchase Timeline</h2>
                <PurchaseTimeline
                  sales={customerSales}
                  customer={selectedCustomer}
                  onDelete={(sale) => {
                    const effectivePrice = selectedCustomer ? getEffectivePrice(selectedCustomer) : sale.unitPrice;
                    const recalculatedTotal = sale.quantity * effectivePrice;
                    requestDeleteSale(
                      sale.id,
                      selectedCustomer?.name || 'Unknown',
                      `₱${recalculatedTotal.toFixed(2)}`,
                      formatDate(sale.date)
                    );
                  }}
                />
              </div>
            </>
          )}

          {/* Empty State */}
          {!selectedCustomer && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No customer selected</p>
                  <p className="text-sm mt-1">
                    Please select a customer to view their purchase history
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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

        {/* Customer Debt History Modal with Error Boundary */}
        <DebtErrorBoundary
          fallbackTitle="Debt History Unavailable"
          fallbackMessage="Unable to load debt history modal. Please try again later."
          onRetry={retryDebtData}
        >
          <CustomerDebtHistoryModal
            open={debtModalOpen}
            onOpenChange={setDebtModalOpen}
            customerId={selectedCustomerId}
            customerName={selectedCustomer?.name}
            outstandingBalance={outstandingBalance || undefined}
            onRecordPayment={() => {
              // Close debt modal and open payment modal
              setDebtModalOpen(false);
              setPaymentModalOpen(true);
            }}
          />
        </DebtErrorBoundary>

        {/* Payment Recording Modal with Error Boundary */}
        <DebtErrorBoundary
          fallbackTitle="Payment Recording Unavailable"
          fallbackMessage="Unable to load payment recording modal. Please try again later."
          onRetry={retryDebtData}
        >
          <PaymentRecordingModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            customerId={selectedCustomerId}
            customerName={selectedCustomer?.name}
            outstandingBalance={outstandingBalance || undefined}
            onPaymentRecorded={(customerId, amount) => {
              // Refresh outstanding balance data
              refetchOutstandingBalance();
              
              // Invalidate related queries to ensure data consistency
              queryClient.invalidateQueries({
                queryKey: queryKeys.payments.customerPayments(customerId),
              });
              queryClient.invalidateQueries({
                queryKey: queryKeys.payments.customerOutstanding(customerId),
              });
              
              // Show success notification
              notify.success(`Payment of ${formatCurrency(amount)} recorded successfully`);
            }}
          />
        </DebtErrorBoundary>
      </Container>
    </div>
  );
}
