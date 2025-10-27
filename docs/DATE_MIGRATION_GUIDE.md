# Date Handling Migration Guide

This guide helps developers migrate from inconsistent date handling patterns to the standardized date handling system.

## Quick Reference

### Common Replacements

| Old Pattern | New Pattern | Notes |
|-------------|-------------|-------|
| `new Date().toLocaleDateString()` | `formatDate(getTodayISO())` | Timezone-aware |
| `new Date(dateString).toLocaleDateString()` | `formatDate(dateString)` | Consistent formatting |
| `date.toISOString().split('T')[0]` | `toLocalISODate(date)` | Timezone-aware |
| Custom date picker with Popover + Calendar | `<DatePicker />` or `<PastDatePicker />` | Standardized component |
| Manual date range validation | `useDateRange()` hook | Built-in validation |

## Step-by-Step Migration

### 1. Replace Date Formatting

#### Before (Inconsistent):
```typescript
// Multiple different approaches
new Date(sale.date).toLocaleDateString()
new Date(payment.createdAt).toLocaleDateString()
dateRange.from.toLocaleDateString() + ' - ' + dateRange.to.toLocaleDateString()
```

#### After (Standardized):
```typescript
import { formatDate } from '@/lib/utils';
import { DateRangeDisplay } from '@/components/shared/DateRangeDisplay';

// Consistent formatting
formatDate(sale.date)
formatDate(payment.createdAt)

// Or use components for complex displays
<DateRangeDisplay 
  startDate={dateRange.from.toISOString()} 
  endDate={dateRange.to.toISOString()} 
/>
```

### 2. Replace Custom Date Pickers

#### Before (Custom Implementation):
```typescript
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {selectedDate ? formatDate(selectedDateISO) : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => {
        if (!date) return;
        setIsDatePickerOpen(false);
        setSelectedDate(date);
      }}
      disabled={(date) => date > new Date()}
    />
  </PopoverContent>
</Popover>
```

#### After (Standardized Component):
```typescript
import { PastDatePicker } from '@/components/shared/DatePicker';

// Much simpler and consistent
<PastDatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Pick a date"
  ariaLabel="Select date for report"
/>
```

### 3. Replace Manual Date State Management

#### Before (Manual Validation):
```typescript
const [startDate, setStartDate] = useState<Date>();
const [endDate, setEndDate] = useState<Date>();
const [dateError, setDateError] = useState<string>();

const handleStartDateChange = (date: Date) => {
  if (endDate && date > endDate) {
    setDateError('Start date cannot be after end date');
    return;
  }
  
  const diffTime = endDate ? endDate.getTime() - date.getTime() : 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    setDateError('Date range cannot exceed 30 days');
    return;
  }
  
  setStartDate(date);
  setDateError(undefined);
};

const handleEndDateChange = (date: Date) => {
  if (startDate && date < startDate) {
    setDateError('End date cannot be before start date');
    return;
  }
  
  const diffTime = date.getTime() - (startDate?.getTime() || 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    setDateError('Date range cannot exceed 30 days');
    return;
  }
  
  setEndDate(date);
  setDateError(undefined);
};
```

#### After (Hook-based Management):
```typescript
import { useDateRange } from '@/lib/hooks/date';

const {
  startDate,
  endDate,
  error,
  selectStartDate,
  selectEndDate,
  setPresetRange
} = useDateRange({
  maxRange: 30,
  autoAdjustEnd: true
});

// All validation is handled automatically!
// Use selectStartDate and selectEndDate as handlers
```

## Component-Specific Migrations

### Today.tsx
```typescript
// Before
new Date(sale.date).toLocaleDateString()

// After
formatDate(sale.date)
```

### PreviousEntries.tsx
```typescript
// Before - Custom date picker
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="h-4 w-4" />
      Change Date
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      selected={selectedDate}
      onSelect={setSelectedDate}
      disabled={(date) => date > new Date()}
    />
  </PopoverContent>
</Popover>

// After - Standardized component
<PastDatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Change Date"
/>
```

### DateRangeAnalysis.tsx
```typescript
// Before - Dual date pickers
<div className="grid grid-cols-2 gap-4">
  <div>
    <label>Start Date</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          {startDate ? formatDate(startDateISO) : "Pick start date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          selected={startDate}
          onSelect={setStartDate}
          disabled={(date) => date > new Date() || date > endDate}
        />
      </PopoverContent>
    </Popover>
  </div>
  <div>
    <label>End Date</label>
    <Popover>
      <PopoverTrigger asChild>
        <Button>
          {endDate ? formatDate(endDateISO) : "Pick end date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          selected={endDate}
          onSelect={setEndDate}
          disabled={(date) => date > new Date() || date < startDate}
        />
      </PopoverContent>
    </Popover>
  </div>
</div>

// After - Single range picker
<PastDateRangePicker
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  maxRange={365}
  placeholder="Select date range for analysis"
/>
```

## Common Patterns

### 1. Delete Confirmations
```typescript
// Before
requestDeleteSale(
  sale.id,
  customer?.name || 'Unknown',
  `₱${total.toFixed(2)}`,
  new Date(sale.date).toLocaleDateString()
);

// After
requestDeleteSale(
  sale.id,
  customer?.name || 'Unknown',
  `₱${total.toFixed(2)}`,
  formatDate(sale.date)
);
```

### 2. Date Range Displays
```typescript
// Before
const displayRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

// After
import { DateRangeDisplay } from '@/components/shared/DateRangeDisplay';

<DateRangeDisplay 
  startDate={startDate.toISOString()} 
  endDate={endDate.toISOString()} 
/>
```

### 3. Relative Time Displays
```typescript
// Before - Manual relative time
const getRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// After - Component
import { RelativeTime } from '@/components/shared/RelativeTime';

<RelativeTime date={date.toISOString()} maxDays={7} />
```

## Validation Migration

### Before (Manual Validation)
```typescript
const validateDateRange = (start: Date, end: Date) => {
  if (start > end) {
    return 'Start date must be before end date';
  }
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 90) {
    return 'Date range cannot exceed 90 days';
  }
  
  if (start > new Date()) {
    return 'Start date cannot be in the future';
  }
  
  return null;
};
```

### After (Hook Validation)
```typescript
import { useDateRange } from '@/lib/hooks/date';

const dateRange = useDateRange({
  maxRange: 90,
  maxDate: new Date(), // No future dates
  validate: (start, end) => {
    // Custom validation if needed
    if (start && start.getDay() === 0) {
      return 'Start date cannot be Sunday';
    }
    return null;
  }
});

// dateRange.error contains any validation errors
// dateRange.isValid indicates if the range is valid
```

## Import Updates

### Old Imports to Remove
```typescript
// Remove these imports
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// (when used only for date picking)
```

### New Imports to Add
```typescript
// Add these imports
import { formatDate, formatDateTime, formatRelativeDate } from '@/lib/utils';
import { DatePicker, PastDatePicker, DateRangePicker } from '@/components/shared/DatePicker';
import { DateDisplay, DateRangeDisplay, RelativeTime } from '@/components/shared/DateDisplay';
import { useDateSelection, useDateRange } from '@/lib/hooks/date';
```

## Testing Your Migration

### 1. Visual Testing
- Ensure all dates display consistently
- Check that date pickers have the same behavior
- Verify timezone consistency (all dates should show Asia/Manila time)

### 2. Functional Testing
- Test date validation (min/max dates, range limits)
- Verify error messages are user-friendly
- Check keyboard navigation works
- Test accessibility with screen readers

### 3. Edge Cases
- Test with invalid date strings
- Test boundary conditions (min/max dates)
- Test with different timezones (should all normalize to Manila)
- Test performance with many date components

## Rollback Plan

If issues arise during migration, you can temporarily rollback specific components:

```typescript
// Temporary rollback - keep old pattern but add TODO
// TODO: Migrate to standardized date handling
const legacyDateFormat = new Date(dateString).toLocaleDateString();
```

However, this should only be used as a temporary measure while fixing issues.

## Benefits After Migration

✅ **Consistency**: All dates look and behave the same  
✅ **Maintainability**: Single source of truth for date logic  
✅ **Accessibility**: Built-in ARIA support and keyboard navigation  
✅ **Performance**: Optimized components with proper cleanup  
✅ **Developer Experience**: Less boilerplate, better TypeScript support  
✅ **User Experience**: Better error handling and validation  
✅ **Timezone Accuracy**: All dates consistently use Asia/Manila timezone  

## Getting Help

If you encounter issues during migration:

1. Check the [Date Handling Guide](./DATE_HANDLING_GUIDE.md) for detailed usage
2. Look at existing migrated components for examples
3. Check TypeScript interfaces for proper prop usage
4. Test in different browsers and timezones
5. Verify accessibility with screen readers

Remember: The goal is consistency and maintainability. Take time to do the migration properly rather than rushing and creating new inconsistencies.