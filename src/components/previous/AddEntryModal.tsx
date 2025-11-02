/**
 * AddEntryModal - Modal for adding entries to past dates
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - Calculates sale totals using getEffectivePrice()
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Similar to QuickAddForm but for historical dates
 * - Date is pre-filled and read-only
 * - Customer selection with location filter
 * - Auto-calculated amount based on containers and unit price
 * - Optional notes field
 */

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/shared/NumberInput";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { notify } from "@/lib/notifications";
import { cn, formatCurrency, formatDate, formatLocation } from "@/lib/utils";
import { useSettings } from "@/lib/contexts/SettingsContext";
import { usePricing } from "@/lib/hooks/usePricing";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";
import type { Customer, Sale, Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

interface AddEntryModalProps {
  date: string; // ISO date string
  customers: Customer[];
  userId: string;
  open: boolean;
  onClose: () => void;
  onSave: (sale: Omit<Sale, "id" | "createdAt" | "updatedAt">) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AddEntryModal({
  date,
  customers,
  userId,
  open,
  onClose,
  onSave,
}: AddEntryModalProps) {
  const { settings } = useSettings();
  const { getEffectivePrice, isCustomPriceActive } = usePricing();
  const [locationFilter, setLocationFilter] = useState<Location | "all">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [containers, setContainers] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [errors, setErrors] = useState<{ customer?: string; containers?: string }>({});
  const containersInputRef = useRef<HTMLInputElement>(null);
  const errorTone = getSemanticColor("error");
  const infoTone = getSemanticColor("info");

  // Filter customers by location
  const filteredCustomers =
    locationFilter === "all"
      ? customers
      : customers.filter((c) => c.location === locationFilter);

  // Find walk-in customer
  const walkInCustomer = customers.find((c) => c.name === 'Walk-In Customer' && c.location === 'WALK_IN');

  // Get selected customer
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  
  // Check if walk-in is currently selected
  const isWalkInSelected = selectedCustomer?.id === walkInCustomer?.id;

  // Calculate amount with effective pricing
  const containersNum = parseFloat(containers) || 0;
  const effectivePrice = selectedCustomer 
    ? getEffectivePrice(selectedCustomer)
    : settings.unitPrice;
  const amount = containersNum * effectivePrice;

  // Handle Walk-In quick select
  const handleWalkInSelect = () => {
    if (walkInCustomer) {
      setSelectedCustomerId(walkInCustomer.id);
      setLocationFilter("all"); // Reset filter to show all customers
      setErrors((prev) => ({ ...prev, customer: undefined })); // Clear customer error
      containersInputRef.current?.focus(); // Focus containers input
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setLocationFilter("all");
      setSelectedCustomerId("");
      setContainers("");
      setErrors({});
      setNotes("");
      // Focus containers input after a short delay
      setTimeout(() => {
        containersInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Keyboard shortcuts
  useKeyboardShortcut({
    key: 's',
    ctrl: true,
    shift: true,
    alt: true,
    handler: () => {
      if (open) {
        // Programmatically trigger form submit
        const form = document.querySelector<HTMLFormElement>('form');
        if (form) {
          form.requestSubmit();
        }
      }
    },
    description: 'Save entry (Ctrl+Shift+Alt+S)',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors: { customer?: string; containers?: string } = {};

    if (!selectedCustomerId) {
      validationErrors.customer = "Please select a customer";
    }

    const containersValue = parseFloat(containers);
    if (!containers || Number.isNaN(containersValue) || containersValue <= 0) {
      validationErrors.containers = "Enter a valid number of containers";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create sale data
    const saleData: Omit<Sale, "id" | "createdAt" | "updatedAt"> = {
      userId,
      customerId: selectedCustomerId,
      date,
      quantity: containersValue,
      unitPrice: effectivePrice, // Use effective price (custom or global)
      total: amount,
      notes: notes.trim() || undefined,
    };

    onSave(saleData);
    onClose();
    notify.success("Entry added successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Entry for {formatDate(date)}</DialogTitle>
          <DialogDescription>
            Add a new sale entry for the selected date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location-filter">
              Filter customers by location (optional)
            </Label>
            <Select
              value={locationFilter}
              onValueChange={(value) => setLocationFilter(value as Location | "all")}
            >
              <SelectTrigger id="location-filter" className="w-full">
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

          {/* Customer Select */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="customer"
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  aria-invalid={errors.customer ? "true" : "false"}
                  aria-describedby={errors.customer ? "previous-entry-customer-error" : undefined}
                  className={cn(
                    "w-full justify-between",
                    errors.customer && cn(errorTone.border, errorTone.ring)
                  )}
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
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.name} ${customer.location}`}
                          onSelect={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerSearchOpen(false);
                            containersInputRef.current?.focus();
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
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate">{customer.name}</span>
                            <LocationBadge location={customer.location} size="sm" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedCustomer && isCustomPriceActive(selectedCustomer) && (
              <Badge 
                variant="outline" 
                className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 mt-2"
              >
                <span className="text-xs">
                  Custom: {formatCurrency(selectedCustomer.customUnitPrice!)}/gal
                </span>
              </Badge>
            )}
            {errors.customer && (
              <p
                id="previous-entry-customer-error"
                className={cn("text-xs", errorTone.text)}
                role="alert"
              >
                {errors.customer}
              </p>
            )}
          </div>

          {/* Containers Input */}
          <div className="space-y-2">
            <Label htmlFor="containers">Containers *</Label>
            <NumberInput
              value={containers}
              onChange={setContainers}
              min={1}
              step={1}
              quickValues={[5, 10, 15, 20]}
              placeholder="0"
              disabled={!selectedCustomerId}
              inputRef={containersInputRef}
              aria-label="Number of containers"
              aria-describedby={errors.containers ? "previous-entry-containers-error" : undefined}
              className={cn(
                errors.containers && cn(errorTone.border, errorTone.ring)
              )}
            />
            {errors.containers ? (
              <p
                id="previous-entry-containers-error"
                className={cn("text-xs", errorTone.text)}
                role="alert"
              >
                {errors.containers}
              </p>
            ) : !selectedCustomerId ? (
              <p className={cn("text-xs", infoTone.subtext)}>Select customer first</p>
            ) : null}
          </div>

          {/* Amount Display */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="text"
              value={formatCurrency(amount)}
              readOnly
              className="w-full bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {containersNum > 0
                ? `${containersNum} × ${formatCurrency(effectivePrice)}`
                : "Please select a customer to calculate amount"}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
