/**
 * Customer History Page - View detailed purchase history for a specific customer
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, User, CalendarIcon } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { PurchaseTimeline } from "@/components/customer-history/PurchaseTimeline";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useKPIs } from "@/lib/hooks/useKPIs";
import { usePricing } from "@/lib/hooks/usePricing";
import type { KPI } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

// ============================================================================
// Customer History Page Component
// ============================================================================

export function CustomerHistory() {
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
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

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
  const customerKPIs = useMemo(
    () => (selectedCustomerId ? getCustomerKPIs(selectedCustomerId) : []),
    [getCustomerKPIs, selectedCustomerId]
  );

  const loading = customersLoading || salesLoading;
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
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 7)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(7)}
                      className="flex-1 min-w-[80px]"
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 30)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(30)}
                      className="flex-1 min-w-[80px]"
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant={!showAllTime && dateRange.from.getTime() === new Date(new Date().setDate(new Date().getDate() - 90)).setHours(0, 0, 0, 0) ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRangePreset(90)}
                      className="flex-1 min-w-[80px]"
                    >
                      Last 90 days
                    </Button>
                    <Button
                      variant={showAllTime ? "default" : "outline"}
                      size="sm"
                      onClick={handleAllTime}
                      className="flex-1 min-w-[80px]"
                    >
                      All Time
                    </Button>
                  </div>

                  {/* Custom Date Range Picker */}
                  {!showAllTime && (
                    <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex flex-col sm:flex-row gap-2 p-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">From</p>
                            <Calendar
                              mode="single"
                              selected={dateRange.from}
                              onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                              disabled={(date) => date > dateRange.to || date > new Date()}
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">To</p>
                            <Calendar
                              mode="single"
                              selected={dateRange.to}
                              onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                              disabled={(date) => date < dateRange.from || date > new Date()}
                            />
                          </div>
                        </div>
                        <div className="border-t p-3 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateRangeOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setDateRangeOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {customerKPIs.map((kpi, index) => (
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
                      new Date(sale.date).toLocaleDateString()
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
      </Container>
    </div>
  );
}
