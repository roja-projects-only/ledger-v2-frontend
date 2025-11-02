/**
 * EntryCard - Component for displaying sale entry in a card format
 * 
 * Features:
 * - Displays sale details (customer, quantity, total, notes)
 * - Hover actions (edit, delete)
 * - Responsive layout
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocationBadge } from "@/components/shared/LocationBadge";
import { SaleAmount } from "@/components/shared/SaleAmount";
import type { Sale, Customer } from "@/lib/types";
import { getLocationColor, getSemanticColor } from "@/lib/colors";
import { cn, formatDateTime } from "@/lib/utils";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface EntryCardProps {
  sale: Sale;
  customer?: Customer;
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  showActions?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EntryCard({
  sale,
  customer,
  onEdit,
  onDelete,
  showActions = true,
  className,
}: EntryCardProps) {
  const errorTone = getSemanticColor("error");
  const errorFocusText = errorTone.icon.replace("text-", "focus:text-");
  const locationColor = customer ? getLocationColor(customer.location) : null;
  const quantityTone = getSemanticColor("warning");
  const infoTone = getSemanticColor("info");

  return (
    <Card
      className={cn(
        "border border-border/60 rounded-xl shadow-none transition-colors",
        "hover:bg-muted/40",
        className,
      )}
    >
      <CardContent className="px-3 py-2">
        <div className="flex items-center gap-3">
          {locationColor && (
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: locationColor.hex }}
              aria-hidden="true"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight truncate">
                    {customer?.name || "Unknown Customer"}
                  </h3>
                  {customer && (
                    <LocationBadge location={customer.location} size="sm" />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide">
                  <SaleAmount 
                    sale={sale} 
                    customer={customer} 
                    showBadge={true}
                    className="text-sm font-semibold"
                  />
                  <span className={cn("font-medium", quantityTone.text)}>
                    {`${sale.quantity} containers`}
                  </span>
                  <span className={cn("font-medium", infoTone.text)}>
                    {formatDateTime(sale.createdAt)}
                  </span>
                </div>
                {sale.notes && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {sale.notes}
                  </p>
                )}
              </div>
              {showActions && (onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3.5 w-3.5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(sale)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(sale)}
                        className={cn(errorTone.text, errorFocusText)}
                      >
                        <Trash2 className={cn("mr-2 h-3.5 w-3.5", errorTone.icon)} />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

