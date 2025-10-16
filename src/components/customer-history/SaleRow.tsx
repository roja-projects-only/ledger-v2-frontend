/**
 * SaleRow - Single-line compact row for displaying one sale
 * 
 * Features:
 * - One sale per date (business rule)
 * - Colored dot indicator from location
 * - Date, amount, quantity, time in single line
 * - Custom pricing badge (if applicable)
 * - Delete action
 * - Compact ~40px height
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Sale, Customer } from "@/lib/types";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { MoreVertical, Trash2, DollarSign } from "lucide-react";
import { usePricing } from "@/lib/hooks/usePricing";

// ============================================================================
// Types
// ============================================================================

interface SaleRowProps {
  sale: Sale;
  customer: Customer;
  onDelete?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function SaleRow({ sale, customer, onDelete }: SaleRowProps) {
  const { isCustomPriceActive } = usePricing();
  const locationColor = getLocationColor(customer.location);
  const errorTone = getSemanticColor("error");
  const errorFocusText = errorTone.icon.replace("text-", "focus:text-");

  // Format time from ISO timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const hasCustomPricing = isCustomPriceActive(customer);

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 hover:bg-muted/40 transition-colors",
        "min-h-[40px]"
      )}
    >
      {/* Location Indicator Dot */}
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: locationColor.hex }}
        aria-hidden="true"
      />

      {/* Date */}
      <span className="font-medium text-xs sm:text-sm min-w-[70px] sm:min-w-[100px] flex-shrink-0">
        {formatDate(sale.date)}
      </span>

      {/* Amount */}
      <span className="font-semibold text-sm sm:text-base text-primary min-w-[70px] sm:min-w-[90px] flex-shrink-0">
        {formatCurrency(sale.total)}
      </span>

      {/* Quantity - hide on very small screens */}
      <span className="hidden xs:inline text-xs sm:text-sm text-muted-foreground min-w-[80px] sm:min-w-[100px] flex-shrink-0">
        {sale.quantity} {sale.quantity === 1 ? "container" : "containers"}
      </span>

      {/* Time - hide on small screens */}
      <span className="hidden sm:inline text-xs text-muted-foreground min-w-[70px] flex-shrink-0">
        {formatTime(sale.createdAt)}
      </span>

      {/* Custom Pricing Badge - hide on small screens */}
      {hasCustomPricing && (
        <Badge
          variant="default"
          className="hidden sm:flex h-5 px-1.5 text-[10px] flex-shrink-0"
        >
          <DollarSign className="h-3 w-3 mr-0.5" />
          Custom
        </Badge>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Actions Menu */}
      {onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDelete}
              className={cn(errorTone.text, errorFocusText)}
            >
              <Trash2 className={cn("mr-2 h-3.5 w-3.5", errorTone.icon)} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
