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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Check, ChevronsUpDown, User } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { PurchaseTimeline } from "@/components/customer-history/PurchaseTimeline";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useKPIs } from "@/lib/hooks/useKPIs";
import type { KPI } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

// ============================================================================
// Customer History Page Component
// ============================================================================

export function CustomerHistory() {
  const { customers, loading: customersLoading } = useCustomers();
  const { getSalesByCustomer, deleteSale, loading: salesLoading } = useSales();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  // Get selected customer
  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);

  // Get sales for selected customer
  const customerSales = selectedCustomerId
    ? getSalesByCustomer(selectedCustomerId)
    : [];

  // Calculate customer KPIs
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
          <Card>
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
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedCustomer.name}
                        <span className="text-muted-foreground text-sm">
                          ({selectedCustomer.location})
                        </span>
                      </span>
                    ) : (
                      "Select a customer..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
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
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomerId === customer.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{customer.name}</span>
                              <span className="text-muted-foreground text-sm">
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

          {/* Customer Summary (only show if customer selected) */}
          {selectedCustomer && (
            <>
              {/* Customer Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-semibold">
                          {selectedCustomer.name}
                        </span>
                      </div>
                      <LocationBadge
                        location={selectedCustomer.location}
                        showIcon
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  onDelete={(sale) => deleteSale(sale.id)}
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
      </Container>
    </div>
  );
}
