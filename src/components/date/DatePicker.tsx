import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, safeDateFormat } from "@/lib/utils";
import { defaultDateConfig } from "@/lib/dateConfig";
import { Calendar as CalendarIcon } from "lucide-react";

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
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          disabled={[
            minDate ? { before: minDate } : undefined,
            maxDate ? { after: maxDate } : undefined,
          ].filter(Boolean) as any}
          initialFocus
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
