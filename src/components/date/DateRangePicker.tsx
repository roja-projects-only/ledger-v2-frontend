import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, formatDateRange, safeDateFormat } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { Calendar as CalendarIcon } from "lucide-react";

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
    const rules: any[] = [];
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
      <PopoverContent align="start" className="p-0" matchTriggerWidth>
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            setRange(r);
            onStartDateChange(r?.from);
            onEndDateChange(r?.to);
          }}
          numberOfMonths={2}
          disabled={disabledRules}
          initialFocus
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
