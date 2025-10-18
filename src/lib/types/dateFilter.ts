/**
 * Date Filter Types
 * 
 * Type definitions for dashboard date filtering system.
 */

export type DateFilterPreset = '7D' | '30D' | '90D' | '1Y';
export type DateFilterMode = 'preset' | 'custom';

export interface CustomDateRange {
  start: Date;
  end: Date;
}

export interface DateFilterState {
  mode: DateFilterMode;
  preset: DateFilterPreset;
  customRange: CustomDateRange | null;
  comparisonEnabled: boolean;
}

export interface ComputedDateRange {
  startDate: Date;
  endDate: Date;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  label: string;
  comparisonLabel: string;
}
