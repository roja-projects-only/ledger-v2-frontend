import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, safeDateFormat } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { Calendar as CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const base = value ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const label = useMemo(() => {
    if (!value) return placeholder;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: defaultDateConfig.timezone,
    }).format(value);
  }, [value, placeholder]);

  const aria = useMemo(() => {
    if (!value) return placeholder;
    return safeDateFormat(value.toISOString(), (d) =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: defaultDateConfig.timezone,
      }).format(d)
    );
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-start w-[240px] text-left font-normal", !value && "text-muted-foreground", className)}
          aria-label={aria}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" matchTriggerWidth>
        {/* Custom month/year selectors for consistency with app dropdowns */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
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
          mode="single"
          month={viewMonth}
          onMonthChange={(m) => setViewMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          disabled={(() => {
            const rules: Matcher[] = [];
            if (minDate) rules.push({ before: minDate });
            if (maxDate) rules.push({ after: maxDate });
            return rules;
          })()}
          initialFocus
          captionLayout="label"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
