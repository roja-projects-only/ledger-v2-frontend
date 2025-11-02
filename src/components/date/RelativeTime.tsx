import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { formatRelativeDate, safeDateFormat } from "@/lib/utils";

export interface RelativeTimeProps {
  date: string; // ISO
  updateInterval?: number; // ms
  maxDays?: number;
  fallbackFormat?: string;
  className?: string;
}

export function RelativeTime({
  date,
  updateInterval = 60_000,
  maxDays = defaultDateConfig.relativeThresholdDays,
  fallbackFormat,
  className,
}: RelativeTimeProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), updateInterval);
    return () => clearInterval(id);
  }, [updateInterval]);

  const label = useMemo(() => {
    const rel = formatRelativeDate(date, { maxDays });
    if (/\d+\sday/.test(rel) && fallbackFormat) {
      // If outside relative threshold, show absolute using fallback
      return safeDateFormat(date, (d) => new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: fallbackFormat?.includes("h") ? "numeric" : undefined,
        minute: fallbackFormat?.includes(":mm") ? "2-digit" : undefined,
        timeZone: defaultDateConfig.timezone,
      }).format(d));
    }
    return rel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, maxDays, tick, fallbackFormat]);

  const aria = useMemo(() => {
    return safeDateFormat(date, (d) => new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: defaultDateConfig.timezone,
    }).format(d));
  }, [date]);

  return (
    <time dateTime={date} aria-label={aria} className={cn(className)}>
      {label}
    </time>
  );
}

export default RelativeTime;
