# Pricing Implementation Guide

**Version**: 1.0  
**Last Updated**: October 17, 2025

## Overview

This guide explains how to implement custom pricing support in components that display or calculate revenue, totals, or amounts.

## Why This Matters

The application supports **custom pricing per customer**, which can be toggled on/off globally via Settings. When implementing any component that:
- Displays sale totals or revenue
- Calculates amounts based on quantity
- Shows pricing information
- Aggregates financial data

**You MUST use the pricing utilities** to ensure calculations respect the toggle state.

---

## Core Concept

### The Problem
Sales records store `unitPrice` at the time of creation. However, the **effective price** may differ based on:
1. **Toggle OFF**: Always use global `settings.unitPrice` (ignore customer custom prices)
2. **Toggle ON**: Use `customer.customUnitPrice` if set, else fall back to global price

### The Solution
Never calculate totals directly with `sale.unitPrice` or `sale.total`. Always use the pricing utilities. They mirror the backend contract (`settings.enableCustomPricing`, `settings.unitPrice`, `customer.customUnitPrice`) and fall back to sensible defaults while the Settings context is loading.

---

## Implementation Patterns

### Pattern 1: React Components (Hook-based)

**Use Case**: Components that render pricing information

```tsx
import { usePricing } from "@/lib/hooks/usePricing";

export function MyComponent({ sale, customer }: Props) {
  const { getEffectivePrice } = usePricing();
  
  // ✅ CORRECT: Recalculate with effective pricing
  const effectivePrice = getEffectivePrice(customer);
  const recalculatedTotal = sale.quantity * effectivePrice;
  
  return (
    <div>
      <p>Total: {formatCurrency(recalculatedTotal)}</p>
    </div>
  );
}

// ❌ WRONG: Using stored values directly
export function BadComponent({ sale }: Props) {
  return <p>Total: {formatCurrency(sale.total)}</p>; // Ignores toggle!
}
```

### Pattern 2: Utility Functions (Non-Hook)

**Use Case**: Helper functions outside React components (analytics, aggregations)

```typescript
import { getEffectivePriceFromData } from "@/lib/hooks/usePricing";

export function calculateRevenue(
  sales: Sale[],
  customers: Customer[],
  customPricingEnabled: boolean,
  globalUnitPrice: number
): number {
  const customerLookup = new Map(customers.map((c) => [c.id, c]));
  
  return sales.reduce((sum, sale) => {
    const customer = customerLookup.get(sale.customerId);
    // ✅ CORRECT: Use utility function
    const effectivePrice = getEffectivePriceFromData(
      customer,
      globalUnitPrice,
      customPricingEnabled
    );
    return sum + (sale.quantity * effectivePrice);
  }, 0);
}
```

### Pattern 3: Display Components

**Use Case**: Components that show sale amounts

```tsx
import { usePricing } from "@/lib/hooks/usePricing";

export function SaleCard({ sale, customer }: Props) {
  const { getEffectivePrice } = usePricing();
  
  // Recalculate for display
  const effectivePrice = getEffectivePrice(customer);
  const displayTotal = sale.quantity * effectivePrice;
  
  return (
    <Card>
      <p>Quantity: {sale.quantity}</p>
      <p>Total: {formatCurrency(displayTotal)}</p>
    </Card>
  );
}
```

---

## API Reference

### `usePricing()` Hook

**Location**: `src/lib/hooks/usePricing.ts`

```typescript
const {
  getEffectivePrice,      // (customer?: Customer) => number
  calculateTotal,         // (quantity: number, customer?: Customer) => number
  hasCustomPrice,         // (customer?: Customer) => boolean
  isCustomPriceActive,    // (customer?: Customer) => boolean
  customPricingEnabled    // boolean (defaults to true until settings load)
} = usePricing();
```

#### Methods

**`getEffectivePrice(customer?: Customer): number`**
- Returns the price to use for a given customer
- If toggle OFF: returns global price
- If toggle ON: returns custom price if set, else global price

**`calculateTotal(quantity: number, customer?: Customer): number`**
- Shorthand for `quantity * getEffectivePrice(customer)`

**`hasCustomPrice(customer?: Customer): boolean`**
- Checks if customer has a custom price defined (regardless of toggle)

**`isCustomPriceActive(customer?: Customer): boolean`**
- Checks if custom price is ACTIVELY being used (toggle ON + has custom price)

**`customPricingEnabled: boolean`**
- Current state of the custom pricing toggle

### `getEffectivePriceFromData()` Utility

**Location**: `src/lib/hooks/usePricing.ts`

```typescript
function getEffectivePriceFromData(
  customer: Customer | undefined,
  globalUnitPrice: number,
  customPricingEnabled: boolean = true
): number
```

Use this in utility functions that don't have access to React hooks.

---

## Checklist for New Components

When creating a component that deals with pricing:

- [ ] Add pricing warning in file header comment
- [ ] Import `usePricing` hook or `getEffectivePriceFromData` utility
- [ ] Use `getEffectivePrice()` instead of `sale.unitPrice`
- [ ] Recalculate totals instead of using `sale.total` directly
- [ ] Test with toggle ON and OFF to verify behavior
- [ ] Reference this guide: `docs/PRICING_GUIDE.md`

### Header Template

```tsx
/**
 * ComponentName - Brief description
 * 
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - [Describe specific usage: calculations, displays, etc.]
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 */
```

---

## Common Mistakes

### ❌ Mistake 1: Using stored total directly
```tsx
// BAD - Ignores toggle state
<div>{formatCurrency(sale.total)}</div>
```

### ✅ Fix: Recalculate with effective price
```tsx
// GOOD - Respects toggle state
const { getEffectivePrice } = usePricing();
const total = sale.quantity * getEffectivePrice(customer);
<div>{formatCurrency(total)}</div>
```

### ❌ Mistake 2: Using sale.unitPrice directly
```tsx
// BAD - Ignores custom pricing
const revenue = sales.reduce((sum, s) => sum + (s.quantity * s.unitPrice), 0);
```

### ✅ Fix: Use pricing utility
```tsx
// GOOD - Respects toggle and custom prices
const { getEffectivePrice } = usePricing();
const revenue = sales.reduce((sum, s) => {
  const customer = customers.find(c => c.id === s.customerId);
  return sum + (s.quantity * getEffectivePrice(customer));
}, 0);
```

### ❌ Mistake 3: Inline pricing logic
```tsx
// BAD - Duplicates logic, may fall out of sync
const price = settings.enableCustomPricing && customer.customUnitPrice 
  ? customer.customUnitPrice 
  : settings.unitPrice;
```

### ✅ Fix: Use centralized utility
```tsx
// GOOD - Single source of truth
const { getEffectivePrice } = usePricing();
const price = getEffectivePrice(customer);
```

---

## Components Using Pricing

### Pages
- `src/pages/Today.tsx` - Delete confirmations
- `src/pages/PreviousEntries.tsx` - Card displays, delete confirmations
- `src/pages/CustomerHistory.tsx` - Delete confirmations
- `src/pages/Dashboard.tsx` - All KPIs and charts (via hooks)

### Components
- `src/components/today/QuickAddForm.tsx` - Sale creation
- `src/components/today/SalesByLocationChart.tsx` - Revenue aggregation
- `src/components/previous/AddEntryModal.tsx` - Sale creation
- `src/components/previous/DateSummaryCard.tsx` - Revenue summary
- `src/components/customer-history/SaleRow.tsx` - Display total
- `src/components/analysis/DailySalesTrendChart.tsx` - Revenue calculation
- `src/components/analysis/CustomerPerformanceChart.tsx` - Revenue calculation
- `src/components/shared/SaleAmount.tsx` - Display with recalculation

### Utilities
- `src/lib/utils/analytics.ts` - All aggregation functions
- `src/lib/hooks/useKPIs.ts` - KPI calculations
- `src/lib/hooks/useDashboardData.ts` - Dashboard data aggregation

---

## Testing Pricing Changes

When modifying pricing-related code:

1. **Toggle OFF → ON**: Verify custom prices are respected
2. **Toggle ON → OFF**: Verify global price is used for all
3. **Create Sale**: Verify correct price is saved
4. **Display Sale**: Verify correct price is shown
5. **Delete Confirmation**: Verify correct total is shown
6. **Dashboard/Charts**: Verify revenue calculations update

---

## Related Files

- **Hook Definition**: `src/lib/hooks/usePricing.ts`
- **Settings Context**: `src/lib/contexts/SettingsContext.tsx`
- **Analytics Utilities**: `src/lib/utils/analytics.ts`
- **Types**: `src/lib/types.ts` (Customer, Sale interfaces)

---

## Questions?

If you're unsure whether your component needs pricing support, ask:
1. Does it display money amounts?
2. Does it calculate totals from quantities?
3. Does it aggregate revenue across sales?

If **yes** to any → implement pricing support using this guide.
