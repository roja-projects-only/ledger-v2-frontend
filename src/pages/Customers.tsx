/**
 * Customers Page - Manage customer records
 * 
 * Features:
 * - Customer list with search and location filter
 * - Add/edit/delete customers
 * - Table view (desktop) and card view (mobile)
 * - Empty state with CTA
 */

import { useState, useMemo, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useSales } from "@/lib/hooks/useSales";
import { usePagination } from "@/lib/hooks/usePagination";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { usePricing } from "@/lib/hooks/usePricing";
import type { Customer, Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { Badge } from "@/components/ui/badge";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";
import { cn, formatCurrency, formatLocation } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, Users, Loader2, Phone, DollarSign, AlertCircle } from "lucide-react";

// ============================================================================
// Customers Page Component
// ============================================================================

export function Customers() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    requestDeleteCustomer,
    confirmDeleteCustomer,
    cancelDeleteCustomer,
    deleteConfirmation,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();
  const {
    sales,
    loading: salesLoading,
    error: salesError,
  } = useSales();
  const { settings } = useSettings();
  const { isCustomPriceActive } = usePricing();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Dialog state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer form state
  const [customerName, setCustomerName] = useState("");
  const [customerLocation, setCustomerLocation] = useState<Location | "">("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCustomPrice, setCustomerCustomPrice] = useState("");
  const [customerCreditLimit, setCustomerCreditLimit] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Responsive items per page
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 4 : 15;
    }
    return 15;
  });

  // Update items per page on window resize
  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = window.innerWidth < 768 ? 4 : 15;
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Customer statistics (entries and total sales per customer)
  const customerStats = useMemo(() => {
    if (!sales) return {};
    
    return sales.reduce((acc, sale) => {
      if (!acc[sale.customerId]) {
        acc[sale.customerId] = { entries: 0, totalSales: 0 };
      }
      acc[sale.customerId].entries += 1;
      acc[sale.customerId].totalSales += sale.total;
      return acc;
    }, {} as Record<string, { entries: number; totalSales: number }>);
  }, [sales]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = locationFilter === "all" || customer.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [customers, searchQuery, locationFilter]);

  // Pagination for customer list
  // Responsive: 4 items on mobile, 15 on desktop
  const {
    currentPage,
    totalPages,
    pageItems: displayedCustomers,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredCustomers, {
    itemsPerPage,
  });

  // ============================================================================
  // Customer Handlers
  // ============================================================================

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerName("");
    setCustomerLocation("");
    setCustomerPhone("");
    setCustomerCustomPrice("");
    setCustomerCreditLimit("");
    setCustomerNotes("");
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerName(customer.name);
    setCustomerLocation(customer.location);
    setCustomerPhone(customer.phone || "");
    setCustomerCustomPrice(customer.customUnitPrice ? String(customer.customUnitPrice) : "");
    setCustomerCreditLimit(customer.creditLimit ? String(customer.creditLimit) : "");
    setCustomerNotes(customer.notes || "");
    setCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    requestDeleteCustomer(customer.id, customer.name);
  };

  const handleSaveCustomer = async () => {
    // Validation
    if (!customerName.trim()) {
      notify.error("Customer name is required");
      return;
    }

    if (!customerLocation) {
      notify.error("Location is required");
      return;
    }

    // Check for duplicate name (case-insensitive, excluding current customer when editing)
    const duplicateName = customers?.find(
      (c) =>
        c.name.toLowerCase() === customerName.trim().toLowerCase() &&
        c.id !== editingCustomer?.id
    );

    if (duplicateName) {
      notify.error("Customer name already exists");
      return;
    }

    if (editingCustomer) {
      // Update existing customer
      await updateCustomer(editingCustomer.id, {
        name: customerName.trim(),
        location: customerLocation,
        phone: customerPhone.trim() || undefined,
        customUnitPrice: customerCustomPrice ? Number(customerCustomPrice) : undefined,
        creditLimit: customerCreditLimit ? Number(customerCreditLimit) : undefined,
        notes: customerNotes.trim() || undefined,
      });
    } else {
      // Create new customer
      await addCustomer({
        name: customerName.trim(),
        location: customerLocation,
        phone: customerPhone.trim() || undefined,
        customUnitPrice: customerCustomPrice ? Number(customerCustomPrice) : undefined,
        creditLimit: customerCreditLimit ? Number(customerCreditLimit) : undefined,
        notes: customerNotes.trim() || undefined,
      });
    }

    setCustomerDialogOpen(false);
    setCustomerName("");
    setCustomerLocation("");
    setCustomerPhone("");
    setCustomerCustomPrice("");
    setCustomerCreditLimit("");
    setCustomerNotes("");
    setEditingCustomer(null);
  };

  // ============================================================================
  // Render
  // ============================================================================

  const loading = customersLoading || salesLoading;
  const apiError = customersError || salesError;
  const errorTone = getSemanticColor("error");

  return (
    <div className="py-6">
      <Container>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your customer records
              </p>
            </div>
            <Button onClick={handleAddCustomer} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Customer
            </Button>
          </div>

          {/* Action Bar - Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Location Filter */}
                <div className="w-full sm:w-52">
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
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
              </div>
          </CardContent>
        </Card>

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

          {/* Customer List */}
          {loading ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : !customers || customers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold">No customers yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Add your first customer to start tracking sales
                  </p>
                  <Button onClick={handleAddCustomer} disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Customer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No customers found matching your search
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop: Table View */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 min-w-[180px]">Name</TableHead>
                          <TableHead className="min-w-[120px]">Location</TableHead>
                          <TableHead className="min-w-[120px]">Phone</TableHead>
                          <TableHead className="min-w-[120px]">Custom Price</TableHead>
                          {(settings.enableCreditFeature ?? true) && (
                            <TableHead className="min-w-[140px]">Credit Status</TableHead>
                          )}
                          <TableHead className="text-right min-w-[80px]">Entries</TableHead>
                          <TableHead className="text-right min-w-[100px]">Total Sales</TableHead>
                          <TableHead className="text-right pr-6 min-w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedCustomers.map((customer) => {
                          const stats = customerStats[customer.id] || { entries: 0, totalSales: 0 };
                          return (
                            <TableRow key={customer.id}>
                              <TableCell className="pl-6 font-medium">{customer.name}</TableCell>
                              <TableCell>
                                <LocationBadge location={customer.location} size="sm" />
                              </TableCell>
                              <TableCell>
                                {customer.phone ? (
                                  <span className="text-sm">{customer.phone}</span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {customer.customUnitPrice != null ? (
                                  <div className="flex items-center gap-2">
                                    {isCustomPriceActive(customer) ? (
                                      <>
                                        <Badge variant="default" className="shrink-0">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          Active
                                        </Badge>
                                        <span className="text-sm font-medium">
                                          {formatCurrency(customer.customUnitPrice)}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Badge variant="outline" className="shrink-0 text-muted-foreground">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Dormant
                                        </Badge>
                                        <span className="text-sm text-muted-foreground line-through">
                                          {formatCurrency(customer.customUnitPrice)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Default</span>
                                )}
                              </TableCell>
                              {(settings.enableCreditFeature ?? true) && (
                                <TableCell>
                                  {customer.outstandingBalance > 0 ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant={customer.collectionStatus === 'OVERDUE' ? 'destructive' : customer.collectionStatus === 'SUSPENDED' ? 'destructive' : 'secondary'}
                                          className="shrink-0"
                                        >
                                          {customer.collectionStatus === 'ACTIVE' ? 'Owes' : customer.collectionStatus}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                          {formatCurrency(customer.outstandingBalance)}
                                        </span>
                                      </div>
                                      {customer.creditLimit && (
                                        <div className="text-xs text-muted-foreground">
                                          {formatCurrency(customer.outstandingBalance)} / {formatCurrency(customer.creditLimit)}
                                          {' '}({Math.round((customer.outstandingBalance / customer.creditLimit) * 100)}%)
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      {customer.creditLimit ? `Limit: ${formatCurrency(customer.creditLimit)}` : 'No debt'}
                                    </div>
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="text-right">{stats.entries}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(stats.totalSales)}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit ${customer.name}`}
                                    disabled={loading}
                                    onClick={() => handleEditCustomer(customer)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${customer.name}`}
                                    disabled={loading}
                                    onClick={() => handleDeleteCustomer(customer)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile: Card View */}
              <div className="md:hidden space-y-3">
                {displayedCustomers.map((customer) => {
                  const stats = customerStats[customer.id] || { entries: 0, totalSales: 0 };
                  return (
                    <Card key={customer.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        {/* Row 1: Name + Location Badge */}
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <h3 className="font-semibold truncate flex-1 min-w-0">{customer.name}</h3>
                          <LocationBadge location={customer.location} size="sm" className="shrink-0" />
                        </div>

                        {/* Row 2: Phone (if exists) */}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm min-w-0">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate min-w-0 flex-1">{customer.phone}</span>
                          </div>
                        )}

                        {/* Row 3: Custom Price (if exists) */}
                        {customer.customUnitPrice != null && (
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            {isCustomPriceActive(customer) ? (
                              <>
                                <Badge variant="default" className="shrink-0">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Custom
                                </Badge>
                                <span className="font-medium whitespace-nowrap">
                                  {formatCurrency(customer.customUnitPrice)}/gal
                                </span>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                                <span className="text-muted-foreground text-sm line-through whitespace-nowrap">
                                  {formatCurrency(customer.customUnitPrice)}/gal
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Row 3.5: Credit Status (if credit feature enabled) */}
                        {(settings.enableCreditFeature ?? true) && customer.outstandingBalance > 0 && (
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <Badge 
                              variant={customer.collectionStatus === 'OVERDUE' ? 'destructive' : customer.collectionStatus === 'SUSPENDED' ? 'destructive' : 'secondary'}
                              className="shrink-0"
                            >
                              {customer.collectionStatus === 'ACTIVE' ? 'Owes' : customer.collectionStatus}
                            </Badge>
                            <span className="font-medium whitespace-nowrap">
                              {formatCurrency(customer.outstandingBalance)}
                            </span>
                            {customer.creditLimit && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                / {formatCurrency(customer.creditLimit)} ({Math.round((customer.outstandingBalance / customer.creditLimit) * 100)}%)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Row 4: Stats */}
                        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap"
>
                          <span className="whitespace-nowrap">{stats.entries} entries</span>
                          <span className="font-medium">
                            {formatCurrency(stats.totalSales)}
                          </span>
                        </div>

                        {/* Row 5: Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={loading}
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={loading}
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={prevPage}
                          className={!canGoPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        
                        // Show ellipsis for gaps
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => goToPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={nextPage}
                          className={!canGoNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Page info */}
                  <p className="text-xs text-muted-foreground">
                    Showing {startIndex}-{endIndex} of {totalItems} customers
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Container>

      {/* Customer Add/Edit Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update customer details."
                : "Create a new customer record."}
            </DialogDescription>
          </DialogHeader>
          {/* Scrollable form area */}
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <div className="space-y-4 py-4">
              {/* Name - Required */}
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Location - Required */}
              <div className="space-y-2">
                <Label htmlFor="customerLocation">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={customerLocation}
                  onValueChange={(value) => setCustomerLocation(value as Location)}
                >
                  <SelectTrigger id="customerLocation" className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
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

              {/* Phone - Optional */}
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="e.g., 0912-345-6789 (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Custom Price - Optional, conditionally shown */}
              {settings.enableCustomPricing && (
                <div className="space-y-2">
                  <Label htmlFor="customerCustomPrice" className="flex items-center gap-2">
                    Custom Price Per Gallon
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="customerCustomPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Default: ${formatCurrency(settings.unitPrice)}`}
                    value={customerCustomPrice}
                    onChange={(e) => setCustomerCustomPrice(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default price of {formatCurrency(settings.unitPrice)}
                  </p>
                </div>
              )}

              {/* Credit Limit - Optional, conditionally shown */}
              {(settings.enableCreditFeature ?? true) && (
                <div className="space-y-2">
                  <Label htmlFor="customerCreditLimit" className="flex items-center gap-2">
                    Credit Limit
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="customerCreditLimit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`Default: ${formatCurrency(settings.defaultCreditLimit ?? 1000)}`}
                    value={customerCreditLimit}
                    onChange={(e) => setCustomerCreditLimit(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default limit of {formatCurrency(settings.defaultCreditLimit ?? 1000)}
                  </p>
                </div>
              )}

              {/* Notes - Optional */}
              <div className="space-y-2">
                <Label htmlFor="customerNotes">Notes</Label>
                <Textarea
                  id="customerNotes"
                  placeholder="Optional additional information..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer}>
              {editingCustomer ? "Update" : "Create"} Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => !open && cancelDeleteCustomer()}
        title="Delete Customer"
        description={
          deleteConfirmation.salesCount > 0
            ? `Cannot delete ${deleteConfirmation.customerName}.\n\nThis customer has ${deleteConfirmation.salesCount} sale(s). Please delete all sales first.`
            : `Are you sure you want to delete ${deleteConfirmation.customerName}?\n\nThis action cannot be undone.`
        }
        confirmText={deleteConfirmation.salesCount > 0 ? 'OK' : 'Delete'}
        cancelText="Cancel"
        onConfirm={confirmDeleteCustomer}
        variant="destructive"
      />
    </div>
  );
}
