import { useCallback, useMemo, useRef, useState } from "react";
import { defaultDateConfig } from "@/lib/dateConfig";
import { toISODateInTZ } from "@/lib/utils";

export interface UseDateRangeOptions {
  defaultStart?: Date;
  defaultEnd?: Date;
  minDate?: Date;
  maxDate?: Date;
  maxRangeDays?: number; // inclusive
  timezone?: string;
}

export interface UseDateRangeResult {
  startDate?: Date;
  endDate?: Date;
  startISO?: string;
  endISO?: string;
  setStartDate: (d: Date | undefined) => void;
  setEndDate: (d: Date | undefined) => void;
  setFromISO: (startISO?: string, endISO?: string) => void;
  setPresetLastNDays: (days: number) => void; // last N days including today
  reset: () => void;
  isValid: boolean;
  errors: string[];
  bounds: { min?: Date; max?: Date; maxRangeDays?: number };
}

function clamp(d: Date, min?: Date, max?: Date) {
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}

export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeResult {
  const {
    defaultStart,
    defaultEnd,
    minDate,
    maxDate,
    maxRangeDays,
    timezone = defaultDateConfig.timezone,
  } = options;

  const initialRange = useMemo(() => {
    let s = defaultStart;
    let e = defaultEnd;
    if (s) s = clamp(s, minDate, maxDate);
    if (e) e = clamp(e, minDate, maxDate);
    if (s && e && e < s) e = s; // auto-fix
    if (s && e && maxRangeDays) {
      const limit = new Date(s);
      limit.setDate(limit.getDate() + maxRangeDays);
      if (e > limit) e = limit;
    }
    return { s, e } as { s?: Date; e?: Date };
  }, [defaultStart, defaultEnd, minDate, maxDate, maxRangeDays]);

  const [startDate, setStartDateState] = useState<Date | undefined>(initialRange.s);
  const [endDate, setEndDateState] = useState<Date | undefined>(initialRange.e);
  const [errors, setErrors] = useState<string[]>([]);

  const prevDurationRef = useRef<number | undefined>(
    startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) : undefined
  );

  const validate = useCallback((s?: Date, e?: Date): string[] => {
    const errs: string[] = [];
    if (s && minDate && s < minDate) errs.push("Start date is before minimum allowed.");
    if (e && maxDate && e > maxDate) errs.push("End date is after maximum allowed.");
    if (s && e && e < s) errs.push("End date cannot be before start date.");
    if (s && e && maxRangeDays) {
      const limit = new Date(s);
      limit.setDate(limit.getDate() + maxRangeDays);
      if (e > limit) errs.push(`Range exceeds maximum of ${maxRangeDays} days.`);
    }
    return errs;
  }, [minDate, maxDate, maxRangeDays]);

  const apply = useCallback((s?: Date, e?: Date) => {
    // clamp and auto-fix
    let ns = s ? clamp(s, minDate, maxDate) : undefined;
    let ne = e ? clamp(e, minDate, maxDate) : undefined;

    if (ns && ne && ne < ns) ne = ns;
    if (ns && ne && maxRangeDays) {
      const limit = new Date(ns);
      limit.setDate(limit.getDate() + maxRangeDays);
      if (ne > limit) ne = limit;
    }

    setStartDateState(ns);
    setEndDateState(ne);
    setErrors(validate(ns, ne));

    // remember duration when both set
    if (ns && ne) {
      prevDurationRef.current = Math.ceil((ne.getTime() - ns.getTime()) / 86400000);
    }
  }, [minDate, maxDate, maxRangeDays, validate]);

  const setStartDate = useCallback((d?: Date) => {
    if (!d) {
      apply(undefined, endDate);
      return;
    }
    // auto adjust end to preserve previous duration if present
    let newEnd = endDate;
    if (prevDurationRef.current !== undefined) {
      const dur = prevDurationRef.current;
      newEnd = new Date(d);
      newEnd.setDate(newEnd.getDate() + dur);
    }
    apply(d, newEnd);
  }, [apply, endDate]);

  const setEndDate = useCallback((d?: Date) => {
    apply(startDate, d);
  }, [apply, startDate]);

  const setFromISO = useCallback((sISO?: string, eISO?: string) => {
    const parse = (iso?: string) => {
      if (!iso) return undefined;
      const [y, m, d] = iso.split("-").map(Number);
      if (!y || !m || !d) return undefined;
      return new Date(y, m - 1, d);
    };
    apply(parse(sISO), parse(eISO));
  }, [apply]);

  const setPresetLastNDays = useCallback((days: number) => {
    const today = new Date();
    const iso = toISODateInTZ(today, timezone);
    const [y, m, d] = iso.split("-").map(Number);
    const end = new Date(y, m - 1, d);
    const start = new Date(end);
    start.setDate(end.getDate() - Math.max(0, days - 1));
    apply(start, end);
  }, [apply, timezone]);

  const reset = useCallback(() => {
    setStartDateState(initialRange.s);
    setEndDateState(initialRange.e);
    setErrors([]);
  }, [initialRange]);

  const startISO = useMemo(() => (startDate ? toISODateInTZ(startDate, timezone) : undefined), [startDate, timezone]);
  const endISO = useMemo(() => (endDate ? toISODateInTZ(endDate, timezone) : undefined), [endDate, timezone]);
  const isValid = errors.length === 0;

  return {
    startDate,
    endDate,
    startISO,
    endISO,
    setStartDate,
    setEndDate,
    setFromISO,
    setPresetLastNDays,
    reset,
    isValid,
    errors,
    bounds: { min: minDate, max: maxDate, maxRangeDays },
  };
}

export default useDateRange;
