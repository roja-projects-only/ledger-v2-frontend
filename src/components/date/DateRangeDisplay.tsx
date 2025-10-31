import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { formatDateRange, safeDateFormat } from "@/lib/utils";
import { parseISO, isValid } from "date-fns";

export type DateRangeDisplayFormat = "short" | "long";

export interface DateRangeDisplayProps {
  startDate: string; // ISO
  endDate: string;   // ISO
  format?: DateRangeDisplayFormat;
  separator?: string;
  className?: string;
}

export function DateRangeDisplay({
  startDate,
  endDate,
  format: mode = "short",
  separator = " - ",
  className,
}: DateRangeDisplayProps) {
  const label = useMemo(() => {
    if (!startDate || !endDate) return "—";
    if (mode === "short") return formatDateRange(startDate, endDate, separator);
    // long -> include times per config
    const s = safeDateFormat(startDate, (d) => d.toISOString());
    const e = safeDateFormat(endDate, (d) => d.toISOString());
    return formatDateRange(s, e, separator);
  }, [startDate, endDate, mode, separator]);

  const aria = useMemo(() => {
    // Build accessible absolute range
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (isValid(s) && isValid(e)) {
        const df = new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: defaultDateConfig.timezone,
        });
        return `${df.format(s)} to ${df.format(e)}`;
      }
    } catch { /* ignore */ }
    return label;
  }, [startDate, endDate, label]);

  return (
    <span aria-label={aria} className={cn(className)}>
      {label}
    </span>
  );
}

export default DateRangeDisplay;
