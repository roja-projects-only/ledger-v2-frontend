import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSemanticColor, type SemanticTone } from "@/lib/colors";

export interface InsightStatProps {
  label: string;
  value: string;
  description?: string;
  tone?: SemanticTone;
}

export function InsightStat({ label, value, description, tone }: InsightStatProps) {
  const theme = tone ? getSemanticColor(tone) : undefined;
  return (
    <div
      className={cn(
        "rounded-lg border bg-background/70 px-4 py-3 shadow-sm",
        theme?.bg,
        theme?.border,
        theme?.text
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
}

export interface SemanticBadgeProps {
  tone: SemanticTone;
  children: ReactNode;
  className?: string;
}

export function SemanticBadge({ tone, children, className }: SemanticBadgeProps) {
  const theme = getSemanticColor(tone);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-xs font-medium",
        theme.bg,
        theme.border,
        theme.text,
        className
      )}
    >
      {children}
    </Badge>
  );
}
