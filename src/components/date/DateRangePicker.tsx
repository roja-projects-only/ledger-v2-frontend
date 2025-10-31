import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, formatDateRange, safeDateFormat } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange as RDPDateRange, Matcher } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  maxRange?: number; // days
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

type Range = { from?: Date; to?: Date } | undefined;

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  maxRange,
  minDate,
  maxDate,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>({ from: startDate, to: endDate });
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const base = startDate ?? endDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // sync internal range with external props
  useEffect(() => {
    setRange({ from: startDate, to: endDate });
  }, [startDate, endDate]);

  const label = useMemo(() => {
    if (!range?.from || !range?.to) return "Pick a date range";
    return formatDateRange(range.from.toISOString(), range.to.toISOString());
  }, [range]);

  const aria = useMemo(() => {
    if (!range?.from || !range?.to) return "Pick a date range";
    const s = safeDateFormat(range.from.toISOString(), (d) => new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "long", day: "numeric", timeZone: defaultDateConfig.timezone,
    }).format(d));
    const e = safeDateFormat(range.to.toISOString(), (d) => new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "long", day: "numeric", timeZone: defaultDateConfig.timezone,
    }).format(d));
    return `${s} to ${e}`;
  }, [range]);

  // derive disabled rules
  const disabledRules = useMemo(() => {
    const rules: Matcher[] = [];
    if (minDate) rules.push({ before: minDate });
    if (maxDate) rules.push({ after: maxDate });

    if (maxRange && range?.from) {
      const maxTo = new Date(range.from);
      maxTo.setDate(maxTo.getDate() + maxRange);
      rules.push({ after: maxTo });
    }
    return rules;
  }, [minDate, maxDate, maxRange, range?.from]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-start w-[280px] text-left font-normal", (!range?.from || !range?.to) && "text-muted-foreground", className)}
          aria-label={aria}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={10} className="w-auto p-4">
        {/* Custom month/year selectors for consistency with app dropdowns */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Select
              value={String(viewMonth.getMonth())}
              onValueChange={(v) => setViewMonth(new Date(viewMonth.getFullYear(), Number(v), 1))}
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue aria-label="Month" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(2000, i, 1))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const year = viewMonth.getFullYear();
              const minYear = minDate ? minDate.getFullYear() : year - 5;
              const maxYear = maxDate ? maxDate.getFullYear() : year + 5;
              const years = Array.from({ length: maxYear - minYear + 1 }, (_, j) => minYear + j);
              return (
                <Select
                  value={String(year)}
                  onValueChange={(v) => setViewMonth(new Date(Number(v), viewMonth.getMonth(), 1))}
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue aria-label="Year" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
          </div>
        </div>
        <Calendar
          mode="range"
          month={viewMonth}
          onMonthChange={(m) => setViewMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
          selected={(range?.from
            ? ({ from: range.from, to: range.to } as RDPDateRange)
            : undefined) as RDPDateRange | undefined}
          onSelect={(r) => {
            setRange(r);
            onStartDateChange(r?.from);
            onEndDateChange(r?.to);
          }}
          numberOfMonths={2}
          disabled={disabledRules}
          initialFocus
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
