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
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
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
import { useSales } from "@/lib/hooks/useSales";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useAuth } from "@/lib/hooks/useAuth";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import type { Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { cn, formatDate, formatLocation, formatCurrency, getTodayISO } from "@/lib/utils";

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
    requestDeleteSale,
    confirmDeleteSale,
    cancelDeleteSale,
    deleteConfirmation,
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 entries per page

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  // Reset to page 1 when filters or date changes
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedDateISO, customerFilter, locationFilter]);

  // Keyboard shortcuts
  useKeyboardShortcut([
    {
      key: 'k',
      ctrl: true,
      shift: true,
      handler: () => {
        setAddModalOpen(true);
      },
      description: 'New entry',
    },
    {
      key: 'Escape',
      handler: () => {
        if (addModalOpen) {
          setAddModalOpen(false);
        }
      },
      description: 'Close modal',
    },
    {
      key: '/',
      handler: () => {
        // Focus customer filter dropdown
        const filterSelect = document.querySelector<HTMLButtonElement>('[role="combobox"]');
        filterSelect?.click();
      },
      description: 'Focus search',
    },
  ]);

  const loading = customersLoading || salesLoading;
  const hasCustomers = Array.isArray(customers) && customers.length > 0;
  const apiError = customersError || salesError;
  const errorTone = getSemanticColor("error");

  return (
    <>
      <Container>
        <div className="py-6 space-y-6">
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
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate">Select Date</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Selected Date</p>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground break-words">
                    {formatDate(selectedDateISO)}
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between min-w-0"
                      aria-label="Change selected date"
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        <span className="font-medium truncate">Change Date</span>
                      </span>
                      <span className="text-sm text-muted-foreground shrink-0 ml-2 hidden sm:inline">
                        {formatDate(selectedDateISO)}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg truncate">Filters</CardTitle>
                  <p className="text-xs text-muted-foreground break-words">
                    Narrow the list by customer or delivery location.
                  </p>
                </div>
                {(customerFilter !== "all" || locationFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
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
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="customer-filter">Customer</Label>
                  <Select
                    value={customerFilter}
                    onValueChange={setCustomerFilter}
                    disabled={loading}
                  >
                    <SelectTrigger id="customer-filter" className="w-full">
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
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="location-filter">Location</Label>
                  <Select
                    value={locationFilter}
                    onValueChange={(value) => setLocationFilter(value as Location | "all")}
                    disabled={loading}
                  >
                    <SelectTrigger id="location-filter" className="w-full">
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
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  "h-2.5 w-2.5 rounded-full border shrink-0",
                                  colors.bg,
                                  colors.border,
                                )}
                              />
                              <span className="capitalize truncate">{formatLocation(location).toLowerCase()}</span>
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
              <div className="space-y-3">
                {loading ? (
                  // Loading skeleton
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 rounded-lg bg-muted animate-pulse"
                      />
                    ))}
                  </>
                ) : filteredSales.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Plus className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No entries for this date</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add Entry" above to record a sale
                    </p>
                  </div>
                ) : (
                  // Entries list - no fixed height, flows with page scroll
                  <>
                    {paginatedSales.map((sale) => {
                      const customer = customers?.find((c) => c.id === sale.customerId);
                      return (
                        <div key={sale.id}>
                          <div className="rounded-lg border bg-card p-4 space-y-3">
                            {/* Customer info */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-lg truncate">
                                  {customer?.name || "Unknown Customer"}
                                </h3>
                                {customer && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={cn(
                                        "h-2 w-2 rounded-full shrink-0",
                                        getLocationColor(customer.location).bg,
                                        getLocationColor(customer.location).border,
                                        "border",
                                      )}
                                    />
                                    <span className="text-sm text-muted-foreground truncate">
                                      {formatLocation(customer.location)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const customer = customers?.find(c => c.id === sale.customerId);
                                  requestDeleteSale(
                                    sale.id,
                                    customer?.name || 'Unknown',
                                    `₱${(sale.quantity * sale.unitPrice).toFixed(2)}`,
                                    new Date(sale.date).toLocaleDateString()
                                  );
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                aria-label="Delete entry"
                              >
                                ×
                              </button>
                            </div>

                            {/* Sale details */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Quantity</p>
                                <p className="font-medium">{sale.quantity} gallons</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-semibold text-lg">
                                  {formatCurrency(sale.total)}
                                </p>
                              </div>
                            </div>

                            {/* Notes if present */}
                            {sale.notes && (
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">Note:</p>
                                <p className="text-sm mt-1">{sale.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            <PaginationItem>
                              <span className="text-sm text-muted-foreground px-4">
                                Page {currentPage} of {totalPages} ({filteredSales.length} total)
                              </span>
                            </PaginationItem>
                            
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </div>
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
    </>
  );
}

