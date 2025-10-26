/**
 * QuickAddForm - Fast data entry form for adding sales
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - Calculates sale totals using getEffectivePrice()
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Location filter to narrow customer selection
 * - Customer combobox with search
 * - Containers input with auto-focus
 * - Auto-calculated amount (read-only)
 * - Optional notes field
 * - Form resets after successful submission
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Customer, Location, Sale, PaymentType } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency, formatLocation, getTodayISO } from "@/lib/utils";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { usePricing } from "@/lib/hooks/usePricing";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { Plus, Check, ChevronsUpDown, DollarSign, AlertCircle, UserPlus, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/shared/NumberInput";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import { paymentsApi } from "@/lib/api/payments.api";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================================================
// Types
// ============================================================================

interface QuickAddFormProps {
  customers: Customer[];
  userId: string;
  onSave: (saleData: Omit<Sale, "id" | "createdAt">) => void;
  loading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function QuickAddForm({ customers, userId, onSave, loading = false }: QuickAddFormProps) {
  const { settings } = useSettings();
  const { 
    getEffectivePrice, 
    hasCustomPrice, 
    isCustomPriceActive,
    customPricingEnabled 
  } = usePricing();
  const containersInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const focusContainersInput = useCallback(() => {
    if (!isMobile) {
      containersInputRef.current?.focus();
    }
  }, [isMobile]);
  const errorTone = getSemanticColor("error");
  const infoTone = getSemanticColor("info");

  // Form state
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [customerId, setCustomerId] = useState("");
  const [containers, setContainers] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [notes, setNotes] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [errors, setErrors] = useState<{ customer?: string; containers?: string; credit?: string }>({});

  // Auto-focus containers input on mount (desktop only, not mobile)
  useEffect(() => {
    focusContainersInput();
  }, [focusContainersInput]);

  // Filtered customers based on location filter
  const filteredCustomers = locationFilter === "all"
    ? customers
    : customers.filter((c) => c.location === locationFilter);

  // Find walk-in customer
  const walkInCustomer = customers.find((c) => c.name === 'Walk-In Customer' && c.location === 'WALK_IN');

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === customerId);
  
  // Check if walk-in is currently selected
  const isWalkInSelected = selectedCustomer?.id === walkInCustomer?.id;

  // Fetch customer outstanding balance for credit warnings
  const { data: outstandingBalance } = useQuery({
    queryKey: ['customer-outstanding', customerId],
    queryFn: () => paymentsApi.getCustomerOutstanding(customerId),
    enabled: !!customerId && paymentType === "CREDIT",
    staleTime: 30000, // 30 seconds
  });

  // Get effective price (custom or global based on toggle)
  const effectivePrice = selectedCustomer 
    ? getEffectivePrice(selectedCustomer) 
    : settings.unitPrice;

  // Calculate amount with effective price
  const amount = containers && !isNaN(Number(containers))
    ? Number(containers) * effectivePrice
    : 0;

  // Credit limit validation
  const creditLimit = selectedCustomer?.creditLimit || 0;
  const currentBalance = outstandingBalance?.totalOwed || 0;
  const newBalance = currentBalance + amount;
  const creditUtilization = creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0;
  
  const isCreditLimitExceeded = paymentType === "CREDIT" && newBalance > creditLimit;
  const isCreditLimitWarning = paymentType === "CREDIT" && creditUtilization >= 80 && !isCreditLimitExceeded;

  /**
   * Handle Walk-In quick select
   */
  const handleWalkInSelect = () => {
    if (walkInCustomer) {
      setCustomerId(walkInCustomer.id);
      setLocationFilter("all"); // Reset filter to show all customers
      setErrors((prev) => ({ ...prev, customer: undefined })); // Clear customer error
      focusContainersInput(); // Focus containers input
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});

    const validationErrors: { customer?: string; containers?: string; credit?: string } = {};

    if (!customerId) {
      validationErrors.customer = "Please select a customer";
    }

    const containersNum = Number(containers);
    if (!containers || isNaN(containersNum) || containersNum <= 0) {
      validationErrors.containers = "Enter a valid number of containers";
    }

    // Credit limit validation
    if (paymentType === "CREDIT" && isCreditLimitExceeded) {
      validationErrors.credit = "Credit limit exceeded. Please reduce quantity or use cash payment.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create sale data with effective price
    const saleData: Omit<Sale, "id" | "createdAt"> = {
      userId,
      customerId,
      date: getTodayISO(),
      quantity: containersNum,
      unitPrice: effectivePrice, // Use effective price (custom or global)
      total: amount,
      paymentType, // Include payment type
      notes: notes.trim() || undefined,
    };

    // Save
    onSave(saleData);

    // Reset form
    setCustomerId("");
    setContainers("");
    setPaymentType("CASH");
    setNotes("");
    setComboboxOpen(false);
    setErrors({});

    // Refocus containers field
    window.setTimeout(() => {
      focusContainersInput();
    }, 100);
  };

  // Keyboard shortcut for save
  useKeyboardShortcut({
    key: 's',
    ctrl: true,
    shift: true,
    alt: true,
    handler: (e) => {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    },
    description: 'Save (Ctrl+Shift+Alt+S)',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add Entry</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="locationFilter">Filter by Location (Optional)</Label>
            <Select
              value={locationFilter}
              onValueChange={(value) => setLocationFilter(value as Location | "all")}
              disabled={loading}
            >
              <SelectTrigger id="locationFilter" className="w-full">
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

          {/* Walk-In Quick Select */}
          {walkInCustomer && (
            <div className="space-y-2">
              <Button
                type="button"
                variant={isWalkInSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-start gap-2",
                  isWalkInSelected && "ring-2 ring-offset-2 ring-primary"
                )}
                onClick={handleWalkInSelect}
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">Walk-In Customer</span>
                {isWalkInSelected && <Check className="ml-auto h-4 w-4" />}
              </Button>
              <p className="text-xs text-muted-foreground">
                Quick select for customers not in the system
              </p>
            </div>
          )}

          {/* Payment Type Toggle */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentType === "CASH" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setPaymentType("CASH")}
                disabled={loading}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </Button>
              <Button
                type="button"
                variant={paymentType === "CREDIT" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setPaymentType("CREDIT")}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4" />
                Credit
              </Button>
            </div>
          </div>

          {/* Customer Combobox */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              Customer <span className={errorTone.text}>*</span>
            </Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="customer"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  aria-invalid={errors.customer ? "true" : "false"}
                  aria-describedby={errors.customer ? "quick-add-customer-error" : undefined}
                  className={cn(
                    "w-full justify-between",
                    errors.customer && cn(errorTone.border, errorTone.ring)
                  )}
                  disabled={loading}
                >
                  {selectedCustomer ? (
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{selectedCustomer.name}</span>
                      <LocationBadge location={selectedCustomer.location} size="sm" />
                    </span>
                  ) : (
                    "Select customer..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.location}`}
                        onSelect={() => {
                          setCustomerId(customer.id);
                          setComboboxOpen(false);
                          focusContainersInput();
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate">{customer.name}</span>
                          <LocationBadge location={customer.location} size="sm" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.customer && (
              <p
                id="quick-add-customer-error"
                className={cn("text-xs", errorTone.text)}
                role="alert"
              >
                {errors.customer}
              </p>
            )}

            {/* Outstanding Balance Warning */}
            {selectedCustomer && paymentType === "CREDIT" && outstandingBalance && outstandingBalance.totalOwed > 0 && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedCustomer.name}</strong> has an outstanding balance of{" "}
                  <strong>{formatCurrency(outstandingBalance.totalOwed)}</strong>
                  {outstandingBalance.daysPastDue > 0 && (
                    <span className="text-orange-600">
                      {" "}({outstandingBalance.daysPastDue} days overdue)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Containers Input */}
          <div className="space-y-2">
            <Label htmlFor="containers">
              Containers <span className={errorTone.text}>*</span>
            </Label>
            <NumberInput
              value={containers}
              onChange={setContainers}
              min={1}
              step={1}
              quickValues={[5, 10, 15, 20]}
              placeholder="0"
              disabled={loading}
              inputRef={containersInputRef}
              aria-label="Number of containers"
              aria-describedby={errors.containers ? "quick-add-containers-error" : undefined}
              className={cn(
                errors.containers && cn(errorTone.border, errorTone.ring)
              )}
            />
            {errors.containers && (
              <p
                id="quick-add-containers-error"
                className={cn("text-xs", errorTone.text)}
                role="alert"
              >
                {errors.containers}
              </p>
            )}

            {/* Credit Limit Warnings */}
            {paymentType === "CREDIT" && selectedCustomer && amount > 0 && (
              <div className="space-y-2">
                {isCreditLimitWarning && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Credit Limit Warning:</strong> This sale will bring the customer to{" "}
                      <strong>{creditUtilization.toFixed(0)}%</strong> of their credit limit 
                      ({formatCurrency(newBalance)} / {formatCurrency(creditLimit)})
                    </AlertDescription>
                  </Alert>
                )}
                
                {isCreditLimitExceeded && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Credit Limit Exceeded:</strong> This sale would exceed the customer's credit limit.
                      New balance would be {formatCurrency(newBalance)} (limit: {formatCurrency(creditLimit)})
                    </AlertDescription>
                  </Alert>
                )}

                {errors.credit && (
                  <p className={cn("text-xs", errorTone.text)} role="alert">
                    {errors.credit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amount (Read-only) */}
          <div className="space-y-2 min-h-[80px]">
            <Label htmlFor="amount">Amount</Label>
            
            {/* Price indicator with badge */}
            {selectedCustomer && (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {isCustomPriceActive(selectedCustomer) ? (
                  <>
                    <Badge variant="default" className="shrink-0">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Custom
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(selectedCustomer.customUnitPrice!)}/gal
                    </span>
                  </>
                ) : hasCustomPrice(selectedCustomer) && !customPricingEnabled ? (
                  <>
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Disabled
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Using Default: {formatCurrency(settings.unitPrice)}/gal
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Default: {formatCurrency(settings.unitPrice)}/gal
                  </span>
                )}
              </div>
            )}
            
            <Input
              id="amount"
              type="text"
              value={formatCurrency(amount)}
              readOnly
              disabled
              className="w-full bg-muted"
            />
            
            {selectedCustomer && containers && (
              <p className={cn("text-xs", infoTone.subtext)}>
                {containers} × {formatCurrency(effectivePrice)} per container
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (paymentType === "CREDIT" && isCreditLimitExceeded)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {paymentType === "CREDIT" ? "Credit" : "Cash"} Entry
          </Button>

          {/* Quick Stats Info */}
          <div className="pt-3 border-t border-border/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-medium">{formatCurrency(settings.unitPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Customers</span>
              <span className="font-medium">{customers.length}</span>
            </div>
            {locationFilter !== "all" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">In {locationFilter}</span>
                <span className="font-medium">{filteredCustomers.length} customers</span>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
