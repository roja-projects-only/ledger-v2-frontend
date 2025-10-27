/**
 * usePricing - Custom hook for pricing calculations with custom pricing support
 * 
 * Handles pricing logic with toggle-aware behavior:
 * - When enableCustomPricing is ON: Use customer.customUnitPrice if set, else global
 * - When enableCustomPricing is OFF: Always use global price (ignore custom prices)
 */

import { useSettings } from "@/lib/hooks/useSettings";
import type { Customer } from "@/lib/types";

// ============================================================================
// Hook
// ============================================================================

export function usePricing() {
  const { settings } = useSettings();

  /**
   * Get effective unit price for a customer
   * Checks if custom pricing is enabled, then checks customer custom price, falls back to global
   */
  const getEffectivePrice = (customer?: Customer): number => {
    // Check if custom pricing feature is enabled
    const customPricingEnabled = settings.enableCustomPricing ?? true; // Default to true
    
    // If custom pricing is disabled, always use global price
    if (!customPricingEnabled) {
      return settings.unitPrice;
    }
    
    // Custom pricing is enabled - check if customer has custom price
    if (customer?.customUnitPrice != null) {
      return customer.customUnitPrice;
    }
    
    // Fall back to global setting
    return settings.unitPrice;
  };

  /**
   * Calculate total for a quantity and customer
   */
  const calculateTotal = (quantity: number, customer?: Customer): number => {
    return quantity * getEffectivePrice(customer);
  };

  /**
   * Check if customer has a custom price set (regardless of toggle state)
   */
  const hasCustomPrice = (customer?: Customer): boolean => {
    return customer?.customUnitPrice != null;
  };

  /**
   * Check if custom price is actively being used (toggle ON + has custom price)
   */
  const isCustomPriceActive = (customer?: Customer): boolean => {
    const customPricingEnabled = settings.enableCustomPricing ?? true;
    return customPricingEnabled && hasCustomPrice(customer);
  };

  return {
    getEffectivePrice,
    calculateTotal,
    hasCustomPrice,
    isCustomPriceActive,
    customPricingEnabled: settings.enableCustomPricing ?? true,
  };
}

// ============================================================================
// Utility Functions (Non-Hook)
// ============================================================================

/**
 * Get effective price without React hook context (for use in utility functions)
 * 
 * @param customer Customer object (may be undefined if customer not found)
 * @param globalUnitPrice Global unit price fallback
 * @param customPricingEnabled Whether custom pricing feature is enabled
 * @returns Effective price (custom or global based on settings)
 */
export function getEffectivePriceFromData(
  customer: Customer | undefined,
  globalUnitPrice: number,
  customPricingEnabled: boolean = true
): number {
  // If custom pricing is disabled, always use global price
  if (!customPricingEnabled) {
    return globalUnitPrice;
  }
  
  // If customer has custom price, use it
  if (customer?.customUnitPrice != null) {
    return customer.customUnitPrice;
  }
  
  // Fall back to global price
  return globalUnitPrice;
}
