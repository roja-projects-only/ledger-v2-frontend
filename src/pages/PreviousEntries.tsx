/**
 * Previous Entries Page - View and add entries for past dates
 * 
 * Features:
 * - Calendar date selector
 * - Summary card for selected date
 * - Filter by customer and location
 * - Add entry for selected date
 * - List of entries for selected date
 */

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, CalendarIcon } from "lucide-react";
import { DateSummaryCard } from "@/components/previous/DateSummaryCard";
import { AddEntryModal } from "@/components/previous/AddEntryModal";
import { TodayEntriesList } from "@/components/today/TodayEntriesList";
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { cn, formatDate, formatLocation, getTodayISO } from "@/lib/utils";

// ============================================================================
// Previous Entries Page Component
// ============================================================================

export function PreviousEntries() {
  const { user } = useAuth();
  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();
  const {
    addSale,
    getSalesByDate,
    deleteSale,
    loading: salesLoading,
    error: salesError,
  } = useSales();

  // Initialize with today's date in Asia/Manila timezone
  const todayInManila = getTodayISO();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const [year, month, day] = todayInManila.split("-").map(Number);
    return new Date(year, month - 1, day);
  });
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Get selected date in ISO format (use local date, not UTC)
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");
  const selectedDateISO = `${year}-${month}-${day}`;

  // Get sales for selected date
  const dateSales = getSalesByDate(selectedDateISO);

  // Apply filters
  const filteredSales = useMemo(() => {
    let filtered = dateSales;

    // Filter by customer
    if (customerFilter !== "all") {
      filtered = filtered.filter((sale) => sale.customerId === customerFilter);
    }

    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter((sale) => {
        const customer = customers?.find((c) => c.id === sale.customerId);
        return customer?.location === locationFilter;
      });
    }

    return filtered;
  }, [dateSales, customerFilter, locationFilter, customers]);

  const loading = customersLoading || salesLoading;
  const hasCustomers = Array.isArray(customers) && customers.length > 0;
  const apiError = customersError || salesError;
  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Previous Entries</h1>
            <p className="text-muted-foreground mt-1">
              View and manage entries from past dates
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

          {/* Three-Card Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Date Selector Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatDate(selectedDateISO)}
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      aria-label="Change selected date"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span className="font-medium">Change Date</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {formatDate(selectedDateISO)}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" matchTriggerWidth>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > new Date()}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Dates in the future are disabled.
                </p>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <DateSummaryCard sales={filteredSales} loading={loading} />

            {/* Filters Card */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Narrow the list by customer or delivery location.
                  </p>
                </div>
                {(customerFilter !== "all" || locationFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCustomerFilter("all");
                      setLocationFilter("all");
                    }}
                    title="Reset filters"
                    aria-label="Reset filters"
                  >
                    ×
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Customer Filter */}
                <div className="space-y-2">
                  <Label htmlFor="customer-filter">Customer</Label>
                  <Select
                    value={customerFilter}
                    onValueChange={setCustomerFilter}
                    disabled={loading}
                  >
                    <SelectTrigger id="customer-filter" className="w-full justify-between">
                      <SelectValue
                        placeholder={loading ? "Loading customers..." : "All Customers"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {hasCustomers ? (
                        customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))
                      ) : (
                        !loading && (
                          <SelectItem value="__no-customers" disabled>
                            No customers available
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Select
                    value={locationFilter}
                    onValueChange={(value) => setLocationFilter(value as Location | "all")}
                    disabled={loading}
                  >
                    <SelectTrigger id="location-filter" className="w-full justify-between">
                      <SelectValue
                        placeholder={loading ? "Loading locations..." : "All Locations"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {LOCATIONS.map((location) => {
                        const colors = getLocationColor(location);
                        return (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full border",
                                  colors.bg,
                                  colors.border,
                                )}
                              />
                              <span className="capitalize">{formatLocation(location).toLowerCase()}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filters */}
              </CardContent>
            </Card>
          </div>

          {/* Add Entry Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Entries for {formatDate(selectedDateISO)}
            </h2>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>

          {/* Entries List */}
          <Card>
            <CardContent className="pt-6">
              <TodayEntriesList
                sales={filteredSales}
                customers={customers || []}
                onDelete={(sale) => deleteSale(sale.id)}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </Container>

      {/* Add Entry Modal */}
      <AddEntryModal
        date={selectedDateISO}
        customers={customers || []}
        userId={user?.id || ""}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(saleData) => addSale(saleData)}
      />
    </div>
  );
}

