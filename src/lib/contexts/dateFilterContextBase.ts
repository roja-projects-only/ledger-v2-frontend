import { createContext } from "react";
import type {
  ComputedDateRange,
  CustomDateRange,
  DateFilterPreset,
  DateFilterState,
} from "@/lib/types/dateFilter";

export interface DateFilterContextValue {
  state: DateFilterState;
  computed: ComputedDateRange;
  setPreset: (preset: DateFilterPreset) => void;
  setCustomRange: (range: CustomDateRange) => void;
  toggleComparison: () => void;
  reset: () => void;
}

export const DateFilterContext = createContext<DateFilterContextValue | undefined>(
  undefined,
);
