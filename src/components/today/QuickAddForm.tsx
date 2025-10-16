/**
 * QuickAddForm - Fast data entry form for adding sales
 * 
 * Features:
 * - Location filter to narrow customer selection
 * - Customer combobox with search
 * - Containers input with auto-focus
 * - Auto-calculated amount (read-only)
 * - Optional notes field
 * - Form resets after successful submission
 */

import { useState, useEffect, useRef } from "react";
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
import type { Customer, Location, Sale } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { cn, formatCurrency, formatLocation, getTodayISO } from "@/lib/utils";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { usePricing } from "@/lib/hooks/usePricing";
import { Plus, Check, ChevronsUpDown, DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/shared/NumberInput";

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
  const errorTone = getSemanticColor("error");
  const infoTone = getSemanticColor("info");

  // Form state
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [customerId, setCustomerId] = useState("");
  const [containers, setContainers] = useState("");
  const [notes, setNotes] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [errors, setErrors] = useState<{ customer?: string; containers?: string }>({});

  // Auto-focus containers input on mount (desktop only, not mobile)
  useEffect(() => {
    // Only auto-focus on desktop (screen width > 768px)
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      containersInputRef.current?.focus();
    }
  }, []);

  // Filtered customers based on location filter
  const filteredCustomers = locationFilter === "all"
    ? customers
    : customers.filter((c) => c.location === locationFilter);

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Get effective price (custom or global based on toggle)
  const effectivePrice = selectedCustomer 
    ? getEffectivePrice(selectedCustomer) 
    : settings.unitPrice;

  // Calculate amount with effective price
  const amount = containers && !isNaN(Number(containers))
    ? Number(containers) * effectivePrice
    : 0;

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});

    const validationErrors: { customer?: string; containers?: string } = {};

    if (!customerId) {
      validationErrors.customer = "Please select a customer";
    }

    const containersNum = Number(containers);
    if (!containers || isNaN(containersNum) || containersNum <= 0) {
      validationErrors.containers = "Enter a valid number of containers";
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
      notes: notes.trim() || undefined,
    };

    // Save
    onSave(saleData);

    // Reset form
    setCustomerId("");
    setContainers("");
    setNotes("");
    setComboboxOpen(false);
    setErrors({});

    // Refocus containers field
    setTimeout(() => {
      containersInputRef.current?.focus();
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Add Entry</CardTitle>
      </CardHeader>
      <CardContent>
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
                          containersInputRef.current?.focus();
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
          <Button type="submit" className="w-full" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
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
