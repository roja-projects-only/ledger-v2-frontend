import { useCallback, useMemo, useState } from "react";
import { defaultDateConfig } from "@/lib/dateConfig";
import { toISODateInTZ } from "@/lib/utils";

export interface UseDateSelectionOptions {
  defaultDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  timezone?: string; // IANA TZ
}

export interface UseDateSelectionResult {
  date: Date | undefined;
  dateISO: string | undefined; // YYYY-MM-DD normalized to timezone
  setDate: (d: Date | undefined) => void;
  setFromISO: (iso: string | undefined) => void;
  setToToday: () => void;
  reset: () => void;
  isValid: boolean;
  errors: string[];
  bounds: { min?: Date; max?: Date };
}

function clampToBounds(d: Date, min?: Date, max?: Date): Date {
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}

export function useDateSelection(options: UseDateSelectionOptions = {}): UseDateSelectionResult {
  const { defaultDate, minDate, maxDate, timezone = defaultDateConfig.timezone } = options;

  const initial = useMemo(() => {
    if (!defaultDate) return undefined as Date | undefined;
    return clampToBounds(defaultDate, minDate, maxDate);
  }, [defaultDate, minDate, maxDate]);

  const [date, setDateState] = useState<Date | undefined>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = useCallback((d: Date | undefined): string[] => {
    const errs: string[] = [];
    if (!d) return errs;
    if (minDate && d < minDate) errs.push("Date is before minimum allowed.");
    if (maxDate && d > maxDate) errs.push("Date is after maximum allowed.");
    return errs;
  }, [minDate, maxDate]);

  const setDate = useCallback((d: Date | undefined) => {
    if (!d) {
      setDateState(undefined);
      setErrors([]);
      return;
    }
    const clamped = clampToBounds(d, minDate, maxDate);
    const errs = validate(clamped);
    setErrors(errs);
    setDateState(clamped);
  }, [minDate, maxDate, validate]);

  const setFromISO = useCallback((iso?: string) => {
    if (!iso) {
      setDate(undefined);
      return;
    }
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) {
      setErrors(["Invalid ISO date string."]);
      return;
    }
    setDate(new Date(y, m - 1, d));
  }, [setDate]);

  const setToToday = useCallback(() => {
    const now = new Date();
    // Preserve day in configured timezone using toISODateInTZ -> construct local Date
    const iso = toISODateInTZ(now, timezone);
    const [y, m, d] = iso.split("-").map(Number);
    setDate(new Date(y, m - 1, d));
  }, [setDate, timezone]);

  const reset = useCallback(() => {
    setDateState(initial);
    setErrors([]);
  }, [initial]);

  const dateISO = useMemo(() => (date ? toISODateInTZ(date, timezone) : undefined), [date, timezone]);
  const isValid = errors.length === 0;

  return {
    date,
    dateISO,
    setDate,
    setFromISO,
    setToToday,
    reset,
    isValid,
    errors,
    bounds: { min: minDate, max: maxDate },
  };
}

export default useDateSelection;
