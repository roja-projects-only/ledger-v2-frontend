/**
 * Performance-optimized KPI formatting utilities
 */

import { formatCurrency } from "@/lib/utils";
import type { KPI } from "@/lib/types";

// Cache for formatted values to avoid repeated formatting
const formatCache = new Map<string, string>();

/**
 * Optimized KPI value formatter with caching
 */
export function formatKpiValue(kpi: KPI): string {
  // Create cache key from KPI properties
  const cacheKey = `${kpi.value}-${kpi.variant}`;
  
  // Check cache first
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)!;
  }
  
  let formattedValue: string;
  
  if (typeof kpi.value !== "number") {
    formattedValue = kpi.value;
  } else if (kpi.variant === "revenue" || kpi.variant === "average") {
    formattedValue = formatCurrency(kpi.value);
  } else {
    formattedValue = kpi.value.toLocaleString();
  }
  
  // Cache the result
  formatCache.set(cacheKey, formattedValue);
  
  // Prevent cache from growing too large
  if (formatCache.size > 100) {
    const firstKey = formatCache.keys().next().value;
    if (firstKey) {
      formatCache.delete(firstKey);
    }
  }
  
  return formattedValue;
}

/**
 * Clear the formatting cache (useful for testing or memory management)
 */
export function clearKpiFormatCache(): void {
  formatCache.clear();
}