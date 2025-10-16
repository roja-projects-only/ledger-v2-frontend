/**
 * SaleAmount - Display sale amount with effective pricing indicator
 * 
 * Shows the recalculated amount based on current toggle state
 * with badge indicators if price differs from stored price
 */

import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle } from "lucide-react";
import { usePricing } from "@/lib/hooks/usePricing";
import { formatCurrency } from "@/lib/utils";
import type { Sale, Customer } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SaleAmountProps {
  sale: Sale;
  customer?: Customer;
  showBadge?: boolean;
  className?: string;
}

export function SaleAmount({ sale, customer, showBadge = true, className }: SaleAmountProps) {
  const { getEffectivePrice, isCustomPriceActive } = usePricing();
  
  const effectivePrice = customer ? getEffectivePrice(customer) : sale.unitPrice;
  const recalculatedTotal = sale.quantity * effectivePrice;
  const isDifferent = Math.abs(recalculatedTotal - sale.total) > 0.01;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showBadge && isDifferent && customer && (
        <>
          {isCustomPriceActive(customer) ? (
            <Badge variant="default" className="shrink-0 text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Custom
            </Badge>
          ) : customer.customUnitPrice != null ? (
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mr-1" />
              Recalc
            </Badge>
          ) : null}
        </>
      )}
      <span className={cn("font-medium", isDifferent && "text-amber-500")}>
        {formatCurrency(recalculatedTotal)}
      </span>
      {showBadge && isDifferent && (
        <span className="text-xs text-muted-foreground line-through">
          {formatCurrency(sale.total)}
        </span>
      )}
    </div>
  );
}
