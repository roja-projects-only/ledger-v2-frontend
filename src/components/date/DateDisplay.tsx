import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import {
  formatRelativeDate,
  safeDateFormat,
} from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";

export type DateDisplayFormat = "short" | "long" | "relative" | "custom";

export interface DateDisplayProps {
  date: string; // ISO 8601 string
  format?: DateDisplayFormat;
  customFormat?: string;
  showTime?: boolean;
  relative?: boolean; // force relative mode
  maxRelativeDays?: number;
  showTimezoneSuffix?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function DateDisplay({
  date,
  format: mode = "short",
  customFormat,
  showTime = false,
  relative = false,
  maxRelativeDays,
  showTimezoneSuffix = false,
  ariaLabel,
  className,
}: DateDisplayProps) {
  const content = useMemo(() => {
    if (!date) return "—";
    if (relative || mode === "relative") {
      return formatRelativeDate(date, {
        maxDays: maxRelativeDays ?? defaultDateConfig.relativeThresholdDays,
        includeTime: showTime,
      });
    }

    // absolute formatting
    const pattern = mode === "custom"
      ? customFormat || (showTime ? defaultDateConfig.dateTimeFormat : defaultDateConfig.dateFormat)
      : mode === "long"
        ? defaultDateConfig.dateTimeFormat
        : defaultDateConfig.dateFormat;

    const formatted = safeDateFormat(
      date,
      (d) => format(d, pattern)
    );

    if (showTimezoneSuffix) {
      try {
        const d = parseISO(date);
        if (isValid(d)) {
          const tz = new Intl.DateTimeFormat(undefined, {
            timeZone: defaultDateConfig.timezone,
            timeZoneName: "short",
          }).format(d);
          const tzShort = tz.split(", ").pop() || ""; // e.g., "GMT+8"
          return `${formatted} ${tzShort}`.trim();
        }
      } catch {
        /* ignore */
      }
    }
    return formatted;
  }, [date, mode, customFormat, showTime, relative, maxRelativeDays, showTimezoneSuffix]);

  const accessibleLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    // absolute label for SR regardless of relative
    const abs = safeDateFormat(
      date,
      (d) => format(d, showTime ? defaultDateConfig.dateTimeFormat : defaultDateConfig.dateFormat)
    );
    return abs;
  }, [ariaLabel, date, showTime]);

  return (
    <time dateTime={date} aria-label={accessibleLabel} className={cn(className)}>
      {content}
    </time>
  );
}

export default DateDisplay;
