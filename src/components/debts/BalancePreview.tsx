import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, TrendingDown, TrendingUp, CircleCheck } from "lucide-react";

interface BalancePreviewProps {
  current: number;
  after: number;
  className?: string;
}

export function BalancePreview({ current, after, className }: BalancePreviewProps) {
  const delta = after - current; // positive = increase owed (charge), negative = decrease (payment)
  const decreased = delta < 0;
  const increased = delta > 0;
  const settled = after === 0;
  // Standardized progress: show magnitude of change relative to CURRENT balance.
  // - Payments (decrease): "Cleared X%"
  // - Charges (increase): "Increase X%"
  const changePct = current > 0 ? Math.min(100, Math.max(0, Math.round((Math.abs(delta) / current) * 100))) : (after > 0 ? 100 : 0);

  return (
    <div className={cn("rounded-md border p-3 space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current</div>
          <div className="text-base font-semibold">{formatCurrency(current)}</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {decreased && <TrendingDown className="h-4 w-4 text-emerald-500" />}
          {increased && <TrendingUp className="h-4 w-4 text-amber-500" />}
          <span className={cn("font-medium", decreased && "text-emerald-600", increased && "text-amber-600")}>{delta === 0 ? "No change" : (decreased ? `-${formatCurrency(Math.abs(delta))}` : `+${formatCurrency(Math.abs(delta))}`)}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">After</div>
            <Badge
              variant="outline"
              aria-hidden={!settled}
              className={cn(
                "h-5 gap-1 px-1.5 text-[11px] transition-opacity duration-200",
                settled ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <CircleCheck className="h-3 w-3 text-emerald-600" /> Settled
            </Badge>
          </div>
          <div className="text-base font-semibold">{formatCurrency(after)}</div>
        </div>
      </div>
      <div>
        <div className="h-2 w-full rounded bg-muted overflow-hidden">
          <div
            className={cn("h-full transition-[width] duration-300", decreased ? "bg-emerald-500" : increased ? "bg-amber-500" : "bg-muted-foreground")}
            style={{ width: `${changePct}%` }}
            aria-label={decreased ? "Percent cleared" : increased ? "Percent increase" : "No change"}
          />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {decreased ? `${changePct}% cleared` : increased ? `Increase ${changePct}%` : 'No change'}
        </div>
      </div>
    </div>
  );
}
