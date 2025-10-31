# Documentation

This directory contains comprehensive documentation for the Water Refilling Ledger application.

## 📅 Date Handling System

The application uses a standardized date handling system to ensure consistency, timezone accuracy, and maintainability across all date-related functionality.

### 📚 Date Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [DATE_HANDLING_GUIDE.md](./DATE_HANDLING_GUIDE.md) | Complete guide to the date handling system | All developers |
| [DATE_MIGRATION_GUIDE.md](./DATE_MIGRATION_GUIDE.md) | Step-by-step migration from old patterns | Developers updating existing code |
| [DATE_QUICK_REFERENCE.md](./DATE_QUICK_REFERENCE.md) | Quick reference for common patterns | Developers needing quick answers |

## 💰 Pricing System

The application supports custom pricing per customer with a global toggle. All components that display or calculate financial data must use the pricing utilities to ensure accuracy.

### 📚 Pricing Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [PRICING_GUIDE.md](./PRICING_GUIDE.md) | Complete guide to the pricing system | All developers |
| [PRICING_QUICK_REFERENCE.md](./PRICING_QUICK_REFERENCE.md) | Quick reference for pricing implementation | Developers needing quick answers |

### 🚀 Getting Started

#### For Date Handling:
1. **New to the project?** Start with the [Date Handling Guide](./DATE_HANDLING_GUIDE.md)
2. **Migrating existing code?** Use the [Date Migration Guide](./DATE_MIGRATION_GUIDE.md)
3. **Need a quick reminder?** Check the [Date Quick Reference](./DATE_QUICK_REFERENCE.md)

#### For Pricing Implementation:
1. **Working with financial data?** Start with the [Pricing Guide](./PRICING_GUIDE.md)
2. **Need quick implementation help?** Use the [Pricing Quick Reference](./PRICING_QUICK_REFERENCE.md)

### 🎯 Key Principles

#### Date Handling:
- **Timezone Consistency**: All dates use Asia/Manila timezone
- **Standardized Formatting**: Consistent date display across the app
- **Component-Based**: Reusable components for common date operations
- **Hook-Based State**: Centralized date state management with validation
- **Accessibility First**: Full ARIA support and keyboard navigation

#### Pricing System:
- **Toggle Awareness**: All financial calculations respect the custom pricing toggle
- **Customer-Specific**: Support for per-customer custom pricing
- **Fallback Logic**: Graceful fallback to global pricing when custom prices aren't set
- **Recalculation**: Always recalculate totals using effective pricing, never use stored values
- **Consistency**: Single source of truth for all pricing logic

### 📦 What's Included

#### Date Handling System

**Core Utilities** (`src/lib/utils.ts`)
- `formatDate()`, `formatDateTime()`, `formatRelativeDate()`
- `createManilaDate()`, `getTodayISO()`, `toLocalISODate()`
- `validateDate()`, `validateDateRange()`, `isBusinessDay()`

**Display Components** (`src/components/shared/`)
- `DateDisplay` - Flexible date formatting
- `DateRangeDisplay` - Smart date range formatting
- `RelativeTime` - Auto-updating relative time

**Input Components** (`src/components/shared/`)
- `DatePicker` - Single date selection
- `DateRangePicker` - Date range selection
- Multiple convenience variants for common use cases

**State Management Hooks** (`src/lib/hooks/`)
- `useDateSelection` - Single date state with validation
- `useDateRange` - Date range state with auto-adjustment
- Multiple convenience hooks for specific scenarios

#### Pricing System

**Core Hook** (`src/lib/hooks/usePricing.ts`)
- `usePricing()` - Main hook for pricing logic
- `getEffectivePrice()` - Get the correct price for a customer
- `calculateTotal()` - Calculate totals with effective pricing
- `getEffectivePriceFromData()` - Utility function for non-React contexts

**Key Features**
- Toggle-aware pricing calculations
- Customer-specific custom pricing support
- Fallback to global pricing when needed
- Consistent pricing logic across all components

### 🔧 Quick Examples

#### Date Handling
```typescript
// Display a date
<DateDisplay date="2025-01-15" format="short" />

// Date input with validation
<PastDatePicker 
  value={selectedDate} 
  onChange={setSelectedDate}
  placeholder="Select date"
/>

// Date range with state management
const { startDate, endDate, error, selectStartDate, selectEndDate } = useDateRange({
  maxRange: 30,
  autoAdjustEnd: true
});
```

#### Pricing Implementation
```typescript
// In React components
const { getEffectivePrice } = usePricing();
const effectivePrice = getEffectivePrice(customer);
const total = sale.quantity * effectivePrice;

// In utility functions
const effectivePrice = getEffectivePriceFromData(
  customer,
  globalUnitPrice,
  customPricingEnabled
);

// Always recalculate, never use stored totals
const displayTotal = sale.quantity * getEffectivePrice(customer);
```

### 🛠️ Development Workflow

#### Date Handling
1. **Always use standardized utilities** instead of manual date formatting
2. **Use appropriate components** for the context (display vs input)
3. **Leverage hooks** for complex date state management
4. **Handle errors gracefully** with proper validation
5. **Test timezone consistency** across different environments

#### Pricing Implementation
1. **Never use stored totals directly** - always recalculate with effective pricing
2. **Use the pricing hook** in React components for pricing logic
3. **Use utility functions** for non-React contexts (analytics, aggregations)
4. **Test both toggle states** - ON (custom pricing) and OFF (global pricing)
5. **Handle missing customers** gracefully with fallback pricing

### 📈 Benefits

#### Date Handling System
- ✅ **Consistent User Experience** - All dates look and behave the same
- ✅ **Maintainable Code** - Single source of truth for date logic
- ✅ **Better Accessibility** - Built-in ARIA support and keyboard navigation
- ✅ **Timezone Accuracy** - All dates consistently use Asia/Manila timezone
- ✅ **Developer Productivity** - Less boilerplate, better TypeScript support
- ✅ **Robust Validation** - Comprehensive error handling and user feedback

#### Pricing System
- ✅ **Accurate Calculations** - All financial data respects custom pricing settings
- ✅ **Flexible Business Logic** - Support for per-customer pricing with global toggle
- ✅ **Consistent Implementation** - Single source of truth for all pricing logic
- ✅ **Easy Maintenance** - Centralized pricing logic reduces bugs and inconsistencies
- ✅ **Business Adaptability** - Easy to enable/disable custom pricing globally
- ✅ **Data Integrity** - Prevents incorrect totals and revenue calculations

### 🔍 Need Help?

1. Check the appropriate documentation file above
2. Look at existing components for examples
3. Review TypeScript interfaces in the source code
4. Test your implementation across different browsers and timezones

---

## 📋 Implementation Notes

### Date Handling System
This standardized date handling system was implemented as part of the date-time-standardization project to replace 23+ inconsistent date handling patterns across the application. All new date-related code should use these standardized utilities and components.

### Pricing System
The pricing system ensures that all financial calculations respect the custom pricing toggle and per-customer pricing settings. Any component that displays or calculates financial data must use the pricing utilities to maintain accuracy and consistency.

### Integration
Both systems work together seamlessly - date components can be used in pricing-related interfaces, and pricing calculations can be combined with date filtering and analysis features.