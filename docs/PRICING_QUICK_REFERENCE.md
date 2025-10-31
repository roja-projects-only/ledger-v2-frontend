# Custom Pricing Quick Reference

**📌 Bookmark This** - Quick lookup for implementing custom pricing in components

---

## 🚨 When You Need This

Your component needs pricing support if it:

- ✅ Displays sale totals or revenue
- ✅ Calculates amounts from quantities
- ✅ Shows pricing information
- ✅ Aggregates financial data

---

## ✅ Header Template (Copy-Paste)

```tsx
/**
 * ComponentName - Brief description
 *
 * ⚠️ PRICING: Uses usePricing() hook for custom pricing support
 * - Respects enableCustomPricing toggle from settings
 * - [Describe what you're calculating: totals, revenue, etc.]
 * - See: src/lib/hooks/usePricing.ts and docs/PRICING_GUIDE.md
 *
 * Features:
 * - Your feature 1
 * - Your feature 2
 */
```

---

## 📦 Import

```tsx
// For React components
import { usePricing } from "@/lib/hooks/usePricing";

// For utility functions
import { getEffectivePriceFromData } from "@/lib/hooks/usePricing";
```

---

## 🎯 React Component Pattern

```tsx
export function MyComponent({ sale, customer }: Props) {
  const { getEffectivePrice } = usePricing();

  // Calculate effective price
  const effectivePrice = getEffectivePrice(customer);
  const total = sale.quantity * effectivePrice;

  return <div>Total: {formatCurrency(total)}</div>;
}
```

---

## 🔧 Utility Function Pattern

```tsx
export function calculateRevenue(
  sales: Sale[],
  customers: Customer[],
  customPricingEnabled: boolean,
  globalUnitPrice: number
): number {
  return sales.reduce((sum, sale) => {
    const customer = customers.find((c) => c.id === sale.customerId);
    const price = getEffectivePriceFromData(
      customer,
      globalUnitPrice,
      customPricingEnabled
    );
    return sum + sale.quantity * price;
  }, 0);
}
```

---

## ❌ Common Mistakes → ✅ Fixes

### Mistake 1: Direct total usage

```tsx
// ❌ BAD - Ignores toggle
<div>{formatCurrency(sale.total)}</div>;

// ✅ GOOD - Respects toggle
const { getEffectivePrice } = usePricing();
const total = sale.quantity * getEffectivePrice(customer);
<div>{formatCurrency(total)}</div>;
```

### Mistake 2: Direct unitPrice usage

```tsx
// ❌ BAD - Ignores custom pricing
const revenue = sales.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0);

// ✅ GOOD - Uses effective price
const { getEffectivePrice } = usePricing();
const revenue = sales.reduce((sum, s) => {
  const customer = customers.find((c) => c.id === s.customerId);
  return sum + s.quantity * getEffectivePrice(customer);
}, 0);
```

### Mistake 3: Inline logic duplication

```tsx
// ❌ BAD - May fall out of sync
const price =
  settings.enableCustomPricing && customer.customUnitPrice
    ? customer.customUnitPrice
    : settings.unitPrice;

// ✅ GOOD - Single source of truth
const { getEffectivePrice } = usePricing();
const price = getEffectivePrice(customer);
```

---

## 🧪 Test Checklist

- [ ] Toggle OFF → All use global price
- [ ] Toggle ON → Custom prices are used
- [ ] No customer → Falls back gracefully
- [ ] Sale creation → Correct price saved
- [ ] Display updates → When toggle changes

---

## 🔗 Integration with Date System

```tsx
// Date-filtered revenue with pricing
import { useDateRange } from "@/lib/hooks/date";
import { usePricing } from "@/lib/hooks/usePricing";

const { getEffectivePrice } = usePricing();
const { startDate, endDate } = useDateRange({ maxRange: 30 });

const revenue = sales
  .filter((sale) => isWithinPeriod(sale.date, startISO, endISO))
  .reduce((sum, sale) => {
    const customer = customers.find((c) => c.id === sale.customerId);
    return sum + sale.quantity * getEffectivePrice(customer);
  }, 0);
```

---

## 📚 Full Documentation

See **`docs/PRICING_GUIDE.md`** for:

- Detailed explanations
- API reference
- Advanced patterns
- Components list
- Testing strategies
- Integration with date handling

**Related**: [Date Handling Guide](./DATE_HANDLING_GUIDE.md) | [Date Quick Reference](./DATE_QUICK_REFERENCE.md)

---

## 🆘 Need Help?

If unsure, check these examples:

- `src/components/today/QuickAddForm.tsx`
- `src/components/customer-history/SaleRow.tsx`
- `src/lib/utils/analytics.ts`

Or read the full guide: **`docs/PRICING_GUIDE.md`**
